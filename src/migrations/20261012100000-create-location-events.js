'use strict';

module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async transaction => {
      await q.createTable('LocationEvents', {
        id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
        locationId: { type: S.INTEGER, allowNull: false, references: { model: 'Locations', key: 'id' }, onDelete: 'CASCADE' },
        authorId: { type: S.INTEGER, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
        title: { type: S.STRING(200), allowNull: false },
        description: { type: S.TEXT, allowNull: false },
        start: { type: S.DATE, allowNull: false },
        end: { type: S.DATE, allowNull: false },
        allDay: { type: S.BOOLEAN, allowNull: false, defaultValue: false },
        timezone: { type: S.STRING(100), allowNull: false },
        venue: { type: S.STRING(500), allowNull: false, defaultValue: '' },
        organizer: { type: S.STRING(200), allowNull: false, defaultValue: '' },
        sourceUrl: { type: S.STRING(2048), allowNull: false, defaultValue: '' },
        category: { type: S.STRING(30), allowNull: false, defaultValue: 'community' },
        status: { type: S.STRING(20), allowNull: false, defaultValue: 'pending' },
        revision: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
        createdAt: { type: S.DATE, allowNull: false },
        updatedAt: { type: S.DATE, allowNull: false },
      }, { transaction });
      await q.addIndex('LocationEvents', ['locationId', 'status', 'start'], { transaction });
      await q.addIndex('LocationEvents', ['status', 'start'], { transaction });
    });
  },
  async down(q) { await q.dropTable('LocationEvents'); },
};
