# badge-minter

## Public Methods

### `initialize`
Initialize the contract. May only be called once.  `admin` is the only address authorized to define badges and manage the contract.

```rust
pub fn initialize(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `define_badge`
Define a new badge that can be minted. Admin only.  `badge_id` must be unique. `max_supply` is the total number that can be minted. `mint_price` is the cost to mint one badge. Use 0 for free badges.

```rust
pub fn define_badge(env: Env, admin: Address, badge_id: u64, name: String, description: String, max_supply: u64, mint_price: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `badge_id` | `u64` |
| `name` | `String` |
| `description` | `String` |
| `max_supply` | `u64` |
| `mint_price` | `i128` |

#### Return Type

`Result<(), Error>`

### `mint_badge`
Mint a badge for a user.  The badge must exist, be active, and have remaining supply. The user must be eligible (set via `set_eligible`) and must not have already minted this badge.

```rust
pub fn mint_badge(env: Env, user: Address, badge_id: u64, quantity: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `badge_id` | `u64` |
| `quantity` | `u64` |

#### Return Type

`Result<(), Error>`

### `set_badge_status`
Set the active status of a badge. Admin only.

```rust
pub fn set_badge_status(env: Env, admin: Address, badge_id: u64, is_active: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `badge_id` | `u64` |
| `is_active` | `bool` |

#### Return Type

`Result<(), Error>`

### `set_eligible`
Record whether a player is eligible to mint a badge. Admin only.  Eligibility is per-badge and must be explicitly granted before `mint_badge` will accept the player.

```rust
pub fn set_eligible(env: Env, admin: Address, player: Address, badge_id: u64, eligible: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `player` | `Address` |
| `badge_id` | `u64` |
| `eligible` | `bool` |

#### Return Type

`Result<(), Error>`

### `get_minted_supply_snapshot`
Return a snapshot of the minted supply for a badge.  This provides a comprehensive view of supply status including total minted, remaining supply, and active status. Returns default values for unknown badge IDs.

```rust
pub fn get_minted_supply_snapshot(env: Env, badge_id: u64) -> MintedSupplySnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `badge_id` | `u64` |

#### Return Type

`MintedSupplySnapshot`

### `get_claim_eligibility_snapshot`
Return a snapshot of claim eligibility for a user and badge.  This provides comprehensive eligibility information including the reason for eligibility status and current mint price. Returns predictable default values for unknown badges or users.

```rust
pub fn get_claim_eligibility_snapshot(env: Env, user: Address, badge_id: u64) -> ClaimEligibilitySnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |
| `badge_id` | `u64` |

#### Return Type

`ClaimEligibilitySnapshot`

### `get_user_minted_badges`
Return the list of badge IDs minted by a user.

```rust
pub fn get_user_minted_badges(env: Env, user: Address) -> Vec<u64>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`Vec<u64>`

### `get_user_mint_records`
Return the complete mint history for a user.

```rust
pub fn get_user_mint_records(env: Env, user: Address) -> Vec<UserMintRecord>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`Vec<UserMintRecord>`

### `holder_summary`
Return a wallet holder summary for `user`.  Unknown users return zero counts. `last_minted_at` is the newest ledger sequence in the user's mint records, or 0 when there are no mints.

```rust
pub fn holder_summary(env: Env, user: Address) -> HolderSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`HolderSummary`

### `expiry_risk_accessor`
Return the badge expiry-risk view for `user`.  Badge expiry is not configured in this contract's current storage model, so the accessor returns `expiry_supported = false`, `risk_bps = 0`, and zero expiry counters for every state.

```rust
pub fn expiry_risk_accessor(env: Env, user: Address) -> ExpiryRiskAccessor
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `user` | `Address` |

#### Return Type

`ExpiryRiskAccessor`

