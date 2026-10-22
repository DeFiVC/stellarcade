const knex = require('knex');
const migration = require('../../migrations/drop_users_balance');

describe('Migration: drop_users_balance', () => {
  let db;

  beforeAll(async () => {
    db = knex({
      client: 'sqlite3',
      connection: ':memory:',
      useNullAsDefault: true,
    });

    // Create users table with balance column
    await db.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('wallet_address', 56).unique().notNullable();
      table.decimal('balance', 20, 7).defaultTo(0);
    });
  });

  afterAll(async () => {
    await db.destroy();
  });

  test('up drops the balance column from users', async () => {
    expect(await db.schema.hasColumn('users', 'balance')).toBe(true);

    await migration.up(db);

    expect(await db.schema.hasColumn('users', 'balance')).toBe(false);
  });

  test('down restores the balance column on users', async () => {
    expect(await db.schema.hasColumn('users', 'balance')).toBe(false);

    await migration.down(db);

    expect(await db.schema.hasColumn('users', 'balance')).toBe(true);
  });

  test('up drops the balance column again idempotently', async () => {
    await migration.up(db);
    expect(await db.schema.hasColumn('users', 'balance')).toBe(false);

    // Running up again when column is already gone should not error
    await expect(migration.up(db)).resolves.not.toThrow();
  });
});
