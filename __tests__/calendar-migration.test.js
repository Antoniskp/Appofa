const { Sequelize, DataTypes } = require('sequelize');
const migration = require('../src/migrations/20261012200000-add-event-review-note');
const subscriptionsMigration = require('../src/migrations/20261123000000-create-calendar-subscriptions');

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

test('subscription migration adds account-scoped rows and cascades location deletion', async () => {
  const db = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  try {
    const query = db.getQueryInterface();
    await query.createTable('Users', { id: { type: DataTypes.INTEGER, primaryKey: true } });
    await query.createTable('Locations', { id: { type: DataTypes.INTEGER, primaryKey: true } });
    await query.bulkInsert('Users', [{ id: 1 }]);
    await query.bulkInsert('Locations', [{ id: 1 }]);

    await subscriptionsMigration.up(query, DataTypes);
    await query.bulkInsert('CalendarSubscriptions', [{ userId: 1, locationId: 1 }]);
    await query.bulkInsert('CalendarSubscriptions', [{ userId: 1, category: 'meeting' }]);
    await expect(query.bulkInsert('CalendarSubscriptions', [{ userId: 1, category: 'meeting' }])).rejects.toMatchObject({
      name: 'SequelizeUniqueConstraintError',
    });
    await query.bulkDelete('Locations', { id: 1 });
    const [rows] = await db.query('SELECT category FROM "CalendarSubscriptions"');
    expect(rows).toEqual([{ category: 'meeting' }]);
    await subscriptionsMigration.down(query);
    expect(await query.showAllTables()).not.toContain('CalendarSubscriptions');
  } finally { await db.close(); }
});
