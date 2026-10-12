const { Sequelize, DataTypes } = require('sequelize');
const migration = require('../src/migrations/20261012200000-add-event-review-note');

test('review-note migration preserves deployed event records and supplies an empty default', async () => {
  const db = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  try {
    const query = db.getQueryInterface();
    await query.createTable('LocationEvents', { id: { type: DataTypes.INTEGER, primaryKey: true }, title: DataTypes.STRING });
    await query.bulkInsert('LocationEvents', [{ id: 1, title: 'Existing live event' }]);
    await migration.up(query, DataTypes);
    const [rows] = await db.query('SELECT * FROM "LocationEvents"');
    expect(rows).toEqual([{ id: 1, title: 'Existing live event', reviewNote: '' }]);
    await migration.down(query);
    const [restored] = await db.query('SELECT * FROM "LocationEvents"');
    expect(restored).toEqual([{ id: 1, title: 'Existing live event' }]);
  } finally { await db.close(); }
});
