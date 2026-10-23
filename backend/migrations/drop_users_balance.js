/**
 * Knex migration dropping the custodial balance column from users table.
 *
 * Players transact directly on-chain from non-custodial Stellar wallets.
 * The internal custodial balance column is deprecated and no longer used.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'balance');
  if (hasColumn) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('balance');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'balance');
  if (!hasColumn) {
    await knex.schema.alterTable('users', (table) => {
      table.decimal('balance', 20, 7).defaultTo(0);
    });
  }
};
