const { validateProductionConfig } = require('../src/config/validateProductionConfig');
const { Sequelize } = require('sequelize');
const migration = require('../src/migrations/20260924000000-add-session-version');

test('rejects missing and example production credentials', () => {
  for (const JWT_SECRET of [undefined, 'short', 'your-production-secret-key-change-this']) {
    expect(() => validateProductionConfig({ NODE_ENV: 'production', JWT_SECRET, DB_PASSWORD: 'a-long-random-password' })).toThrow('JWT_SECRET');
  }
  expect(() => validateProductionConfig({ NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(40), DB_PASSWORD: 'password' })).toThrow('DB_PASSWORD');
  expect(() => validateProductionConfig({ NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(40), DB_PASSWORD: 'a-long-random-password' })).not.toThrow();
  expect(() => validateProductionConfig({ NODE_ENV: 'development' })).not.toThrow();
});

test('session migration backfills existing users and is repeatable', async () => {
  const db = new Sequelize('sqlite::memory:', { logging: false });
  try {
    const qi = db.getQueryInterface();
    await qi.createTable('Users', { id: { type: Sequelize.INTEGER, primaryKey: true } });
    await qi.bulkInsert('Users', [{ id: 1 }]);
    await migration.up(qi, Sequelize);
    await migration.up(qi, Sequelize);
    const [rows] = await db.query('SELECT * FROM Users');
    expect(rows).toEqual([{ id: 1, sessionVersion: '0' }]);
    await migration.down(qi);
    expect((await qi.describeTable('Users')).sessionVersion).toBeUndefined();
  } finally { await db.close(); }
});
