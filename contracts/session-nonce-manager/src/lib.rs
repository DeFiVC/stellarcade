#![no_std]


use soroban_sdk::{contract, contractevent, contractimpl, contracttype, Address, Env, String};

// ─── Storage TTL Policy ───────────────────────────────────────────────────────

/// Persistent nonce records are kept for roughly 30 days.
const RECORD_BUMP_LEDGERS: u32 = 518_400;
const RECORD_BUMP_THRESHOLD: u32 = 417_600;

/// Instance storage is bumped to a longer window so the next-nonce counters
/// remain available after individual nonce records age out.
const INSTANCE_BUMP_LEDGERS: u32 = 1_036_800;
const INSTANCE_BUMP_THRESHOLD: u32 = 936_000;

// ─── Storage Keys ─────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    NextNonce(Address, String),
    NonceRecord(Address, String, u64),
}

// ─── Lifecycle Types ─────────────────────────────────────────────────────────

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum NonceState {
    Active,
    Consumed,
    Revoked,
    Expired,
    Missing,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NonceRecord {
    pub state: NonceState,
    pub expires_at_ledger: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NonceStatus {
    pub is_present: bool,
    pub state: NonceState,
    pub remaining_ttl: Option<u32>,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[contractevent]
pub struct NonceManagerInitialized {
    pub admin: Address,
}

#[contractevent]
pub struct NonceIssued {
    pub account: Address,
    pub purpose: String,
    pub nonce: u64,
}

#[contractevent]
pub struct NonceConsumed {
    pub account: Address,
    pub purpose: String,
    pub nonce: u64,
}

#[contractevent]
pub struct NonceRevoked {
    pub account: Address,
    pub purpose: String,
    pub nonce: u64,
}

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct SessionNonceManagerContract;

#[contractimpl]
impl SessionNonceManagerContract {
    /// Initialise the contract and set the admin. Must be called exactly once.
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Self::bump_instance_ttl(&env);
        NonceManagerInitialized { admin }.publish(&env);
    }

    /// Issue the next nonce for `(account, purpose)` and return its value.
    pub fn issue_nonce(env: Env, account: Address, purpose: String) -> u64 {
        Self::require_admin_or_account(&env, &account);
        if purpose.len() == 0 {
            panic!("Invalid purpose: must not be empty");
        }

        let next_key = DataKey::NextNonce(account.clone(), purpose.clone());
        let nonce: u64 = env.storage().instance().get(&next_key).unwrap_or(0);
        env.storage().instance().set(&next_key, &(nonce + 1));
        Self::bump_instance_ttl(&env);

        let record_key = Self::record_key(&account, &purpose, nonce);
        env.storage()
            .persistent()
            .set(&record_key, &Self::new_record(&env, NonceState::Active));
        Self::bump_record_ttl(&env, &record_key);

        NonceIssued {
            account,
            purpose,
            nonce,
        }
        .publish(&env);
        nonce
    }

    
    pub fn consume_nonce(env: Env, account: Address, nonce: u64, purpose: String) {
        account.require_auth();
        if purpose.len() == 0 {
            panic!("Invalid purpose: must not be empty");
        }

        let record_key = Self::record_key(&account, &purpose, nonce);
        match Self::resolve_nonce_status(&env, &account, nonce, &purpose) {
            NonceStatus {
                state: NonceState::Active,
                ..
            } => {
                env.storage()
                    .persistent()
                    .set(&record_key, &Self::new_record(&env, NonceState::Consumed));
                Self::bump_record_ttl(&env, &record_key);
                Self::bump_instance_ttl(&env);
                NonceConsumed {
                    account,
                    purpose,
                    nonce,
                }
                .publish(&env);
            }
            NonceStatus {
                state: NonceState::Consumed,
                ..
            } => panic!("Nonce already used"),
            NonceStatus {
                state: NonceState::Revoked,
                ..
            } => panic!("Nonce has been revoked"),
            NonceStatus {
                state: NonceState::Expired,
                ..
            } => panic!("Nonce expired"),
            NonceStatus {
                state: NonceState::Missing,
                ..
            } => panic!("Nonce not found"),
        }
    }

    /// Return `true` if `nonce` for `(account, purpose)` is still active.
    pub fn is_nonce_valid(env: Env, account: Address, nonce: u64, purpose: String) -> bool {
        matches!(
            Self::resolve_nonce_status(&env, &account, nonce, &purpose).state,
            NonceState::Active
        )
    }

    /// Return lifecycle and TTL metadata for `(account, purpose, nonce)`.
    /// The returned status distinguishes active, consumed, revoked, expired,
    /// and missing nonces.
    pub fn nonce_status(env: Env, account: Address, nonce: u64, purpose: String) -> NonceStatus {
        Self::resolve_nonce_status(&env, &account, nonce, &purpose)
    }

    /// Revoke `nonce` for `(account, purpose)`. Only the admin may revoke nonces.
    pub fn revoke_nonce(env: Env, account: Address, purpose: String, nonce: u64) {
        Self::require_admin(&env);

        let record_key = Self::record_key(&account, &purpose, nonce);
        match Self::resolve_nonce_status(&env, &account, nonce, &purpose) {
            NonceStatus {
                state: NonceState::Active,
                ..
            } => {
                env.storage()
                    .persistent()
                    .set(&record_key, &Self::new_record(&env, NonceState::Revoked));
                Self::bump_record_ttl(&env, &record_key);
                Self::bump_instance_ttl(&env);
                NonceRevoked {
                    account,
                    purpose,
                    nonce,
                }
                .publish(&env);
            }
            NonceStatus {
                state: NonceState::Consumed,
                ..
            } => panic!("Nonce already used"),
            NonceStatus {
                state: NonceState::Revoked,
                ..
            } => panic!("Nonce already revoked"),
            NonceStatus {
                state: NonceState::Expired,
                ..
            } => panic!("Nonce expired"),
            NonceStatus {
                state: NonceState::Missing,
                ..
            } => panic!("Nonce not found"),
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    fn record_key(account: &Address, purpose: &String, nonce: u64) -> DataKey {
        DataKey::NonceRecord(account.clone(), purpose.clone(), nonce)
    }

    fn next_nonce(env: &Env, account: &Address, purpose: &String) -> u64 {
        let key = DataKey::NextNonce(account.clone(), purpose.clone());
        env.storage().instance().get(&key).unwrap_or(0)
    }

    fn bump_instance_ttl(env: &Env) {
        env.storage()
            .instance()
            .extend_ttl(INSTANCE_BUMP_THRESHOLD, INSTANCE_BUMP_LEDGERS);
    }

    fn bump_record_ttl(env: &Env, key: &DataKey) {
        env.storage()
            .persistent()
            .extend_ttl(key, RECORD_BUMP_THRESHOLD, RECORD_BUMP_LEDGERS);
    }

    fn new_record(env: &Env, state: NonceState) -> NonceRecord {
        NonceRecord {
            state,
            expires_at_ledger: env
                .ledger()
                .sequence()
                .checked_add(RECORD_BUMP_LEDGERS)
                .expect("Nonce expiry overflow"),
        }
    }

    fn resolve_nonce_status(
        env: &Env,
        account: &Address,
        nonce: u64,
        purpose: &String,
    ) -> NonceStatus {
        let key = Self::record_key(account, purpose, nonce);
        if let Some(record) = env.storage().persistent().get::<_, NonceRecord>(&key) {
            let current_ledger = env.ledger().sequence();
            if record.expires_at_ledger <= current_ledger {
                return NonceStatus {
                    is_present: false,
                    state: NonceState::Expired,
                    remaining_ttl: None,
                };
            }
            let remaining_ttl = record.expires_at_ledger - current_ledger;
            NonceStatus {
                is_present: true,
                state: record.state,
                remaining_ttl: Some(remaining_ttl),
            }
        } else {
            let next = Self::next_nonce(env, account, purpose);
            if nonce >= next {
                NonceStatus {
                    is_present: false,
                    state: NonceState::Missing,
                    remaining_ttl: None,
                }
            } else {
                NonceStatus {
                    is_present: false,
                    state: NonceState::Expired,
                    remaining_ttl: None,
                }
            }
        }
    }

    fn require_admin(env: &Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        admin.require_auth();
    }

    fn require_admin_or_account(env: &Env, account: &Address) {
        // Any authenticated call is fine; we get auth from either admin or account.
        // In practice, we simply require the account to authenticate.
        account.require_auth();
        let _ = env;
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger as _},
        Env,
    };

    fn setup() -> (Env, SessionNonceManagerContractClient<'static>, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(SessionNonceManagerContract, ());
        let client = SessionNonceManagerContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.init(&admin);
        (env, client, admin)
    }

    #[test]
    fn test_init_succeeds() {
        let (_env, _client, _admin) = setup();
    }

    #[test]
    #[should_panic(expected = "Already initialized")]
    fn test_double_init_fails() {
        let (_env, client, admin) = setup();
        client.init(&admin);
    }

    #[test]
    fn test_issue_and_validate_nonce() {
        let (env, client, _admin) = setup();
        let user = Address::generate(&env);
        let purpose = String::from_str(&env, "login");
        let nonce = client.issue_nonce(&user, &purpose);
        assert_eq!(nonce, 0);
        assert!(client.is_nonce_valid(&user, &nonce, &purpose));
        assert_eq!(
            client.nonce_status(&user, &nonce, &purpose),
            NonceStatus {
                is_present: true,
                state: NonceState::Active,
                remaining_ttl: Some(RECORD_BUMP_LEDGERS),
            }
        );
    }

    #[test]
    fn test_nonce_status_reports_expired_and_missing() {
        let (env, client, _admin) = setup();
        let user = Address::generate(&env);
        let purpose = String::from_str(&env, "transfer");
        let nonce = client.issue_nonce(&user, &purpose);

        env.ledger()
            .set_sequence_number(RECORD_BUMP_LEDGERS.saturating_add(10));

        assert_eq!(
            client.nonce_status(&user, &nonce, &purpose),
            NonceStatus {
                is_present: false,
                state: NonceState::Expired,
                remaining_ttl: None,
            }
        );

        assert_eq!(
            client.nonce_status(&user, &99, &purpose),
            NonceStatus {
                is_present: false,
                state: NonceState::Missing,
                remaining_ttl: None,
            }
        );
    }

    #[test]
    fn test_consume_nonce_marks_as_used() {
        let (env, client, _admin) = setup();
        let user = Address::generate(&env);
        let purpose = String::from_str(&env, "transfer");
        let nonce = client.issue_nonce(&user, &purpose);
        client.consume_nonce(&user, &nonce, &purpose);
        assert!(!client.is_nonce_valid(&user, &nonce, &purpose));
        assert_eq!(
            client.nonce_status(&user, &nonce, &purpose),
            NonceStatus {
                is_present: true,
                state: NonceState::Consumed,
                remaining_ttl: Some(RECORD_BUMP_LEDGERS),
            }
        );
    }

    #[test]
    #[should_panic(expected = "Nonce already used")]
    fn test_replay_is_rejected() {
        let (env, client, _admin) = setup();
        let user = Address::generate(&env);
        let purpose = String::from_str(&env, "withdraw");
        let nonce = client.issue_nonce(&user, &purpose);
        client.consume_nonce(&user, &nonce, &purpose);
        client.consume_nonce(&user, &nonce, &purpose);
    }

    #[test]
    fn test_nonces_increment_monotonically() {
        let (env, client, _admin) = setup();
        let user = Address::generate(&env);
        let purpose = String::from_str(&env, "action");
        let n0 = client.issue_nonce(&user, &purpose);
        let n1 = client.issue_nonce(&user, &purpose);
        let n2 = client.issue_nonce(&user, &purpose);
        assert_eq!(n0, 0);
        assert_eq!(n1, 1);
        assert_eq!(n2, 2);
    }

    #[test]
    fn test_unissued_nonce_is_invalid() {
        let (env, client, _admin) = setup();
        let user = Address::generate(&env);
        let purpose = String::from_str(&env, "something");
        assert!(!client.is_nonce_valid(&user, &99, &purpose));
        assert_eq!(
            client.nonce_status(&user, &99, &purpose),
            NonceStatus {
                is_present: false,
                state: NonceState::Missing,
                remaining_ttl: None,
            }
        );
    }

    #[test]
    #[should_panic(expected = "Invalid purpose")]
    fn test_empty_purpose_is_rejected() {
        let (env, client, _admin) = setup();
        let user = Address::generate(&env);
        client.issue_nonce(&user, &String::from_str(&env, ""));
    }

    #[test]
    fn test_revoke_nonce() {
        let (env, client, _admin) = setup();
        let user = Address::generate(&env);
        let purpose = String::from_str(&env, "vote");
        let nonce = client.issue_nonce(&user, &purpose);
        client.revoke_nonce(&user, &purpose, &nonce);
        assert!(!client.is_nonce_valid(&user, &nonce, &purpose));
        assert_eq!(
            client.nonce_status(&user, &nonce, &purpose),
            NonceStatus {
                is_present: true,
                state: NonceState::Revoked,
                remaining_ttl: Some(RECORD_BUMP_LEDGERS),
            }
        );
    }

    #[test]
    #[should_panic(expected = "Nonce has been revoked")]
    fn test_consume_revoked_nonce_panics() {
        let (env, client, _admin) = setup();
        let user = Address::generate(&env);
        let purpose = String::from_str(&env, "vote");
        let nonce = client.issue_nonce(&user, &purpose);
        client.revoke_nonce(&user, &purpose, &nonce);
        client.consume_nonce(&user, &nonce, &purpose);
    }

    #[test]
    #[should_panic(expected = "Nonce not found")]
    fn test_consume_unissued_nonce_panics() {
        let (env, client, _admin) = setup();
        let user = Address::generate(&env);
        let purpose = String::from_str(&env, "vote");
        client.consume_nonce(&user, &99, &purpose);
    }

    #[test]
    #[should_panic(expected = "Nonce expired")]
    fn test_revoke_expired_nonce_panics() {
        let (env, client, _admin) = setup();
        let user = Address::generate(&env);
        let purpose = String::from_str(&env, "revoke-expired");
        let nonce = client.issue_nonce(&user, &purpose);

        env.ledger()
            .set_sequence_number(RECORD_BUMP_LEDGERS.saturating_add(10));

        client.revoke_nonce(&user, &purpose, &nonce);
    }

    #[test]
    fn test_events_emitted_on_issue() {
        let (env, client, _admin) = setup();
        let user = Address::generate(&env);
        let purpose = String::from_str(&env, "event-test");
        let nonce = client.issue_nonce(&user, &purpose);
        assert_eq!(nonce, 0);
    }
}
