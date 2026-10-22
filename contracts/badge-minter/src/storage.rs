#![no_std]

use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::*;

// Storage keys

#[contracttype]
pub enum DataKey {
    Admin,
    BadgeDefinition(u64),
    UserMintedBadges(Address),
    UserMintRecords(Address),
    TotalMinted(u64),
    BadgeActiveStatus(u64),
    UserEligible(Address, u64),
}

// Storage TTL constants
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

// Storage functions

pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_badge_definition(env: &Env, badge_id: u64) -> Option<BadgeDefinition> {
    env.storage().persistent().get(&DataKey::BadgeDefinition(badge_id))
}

pub fn set_badge_definition(env: &Env, badge_id: u64, definition: &BadgeDefinition) {
    env.storage().persistent().set(&DataKey::BadgeDefinition(badge_id), definition);
    env.storage().persistent().extend_ttl(
        &DataKey::BadgeDefinition(badge_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn get_user_minted_badges(env: &Env, user: &Address) -> Vec<u64> {
    env.storage()
        .persistent()
        .get(&DataKey::UserMintedBadges(user.clone()))
        .unwrap_or(Vec::new(env))
}

pub fn set_user_minted_badges(env: &Env, user: &Address, badges: &Vec<u64>) {
    env.storage().persistent().set(&DataKey::UserMintedBadges(user.clone()), badges);
    env.storage().persistent().extend_ttl(
        &DataKey::UserMintedBadges(user.clone()),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn get_user_mint_records(env: &Env, user: &Address) -> Vec<UserMintRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::UserMintRecords(user.clone()))
        .unwrap_or(Vec::new(env))
}

pub fn add_mint_record(env: &Env, user: &Address, record: &UserMintRecord) {
    let mut records = get_user_mint_records(env, user);
    records.push_back(record.clone());
    env.storage().persistent().set(&DataKey::UserMintRecords(user.clone()), &records);
    env.storage().persistent().extend_ttl(
        &DataKey::UserMintRecords(user.clone()),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn get_total_minted(env: &Env, badge_id: u64) -> u64 {
    env.storage()
        .persistent()
        .get(&DataKey::TotalMinted(badge_id))
        .unwrap_or(0)
}

pub fn set_total_minted(env: &Env, badge_id: u64, total: u64) {
    env.storage().persistent().set(&DataKey::TotalMinted(badge_id), &total);
    env.storage().persistent().extend_ttl(
        &DataKey::TotalMinted(badge_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn increment_total_minted(env: &Env, badge_id: u64, amount: u64) -> u64 {
    let current = get_total_minted(env, badge_id);
    let new_total = current + amount;
    set_total_minted(env, badge_id, new_total);
    new_total
}

pub fn is_badge_active(env: &Env, badge_id: u64) -> bool {
    env.storage()
        .persistent()
        .get(&DataKey::BadgeActiveStatus(badge_id))
        .unwrap_or(true) // Default to active
}

pub fn set_badge_active_status(env: &Env, badge_id: u64, is_active: bool) {
    env.storage().persistent().set(&DataKey::BadgeActiveStatus(badge_id), &is_active);
    env.storage().persistent().extend_ttl(
        &DataKey::BadgeActiveStatus(badge_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn is_user_eligible(env: &Env, user: &Address, badge_id: u64) -> bool {
    env.storage()
        .persistent()
        .get(&DataKey::UserEligible(user.clone(), badge_id))
        .unwrap_or(false)
}

pub fn set_user_eligible(env: &Env, user: &Address, badge_id: u64, eligible: bool) {
    let key = DataKey::UserEligible(user.clone(), badge_id);
    env.storage().persistent().set(&key, &eligible);
    env.storage().persistent().extend_ttl(
        &key,
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}
