'use strict';

module.exports = {
  async up(queryInterface, S) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn('Locations', 'description', { type: S.TEXT, allowNull: true }, { transaction });
      await queryInterface.createTable('LocationImprovements', {
        id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
        locationId: { type: S.INTEGER, allowNull: false, references: { model: 'Locations', key: 'id' }, onDelete: 'CASCADE' },
        authorId: { type: S.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
        reviewerId: { type: S.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
        kind: { type: S.STRING(20), allowNull: false },
        field: { type: S.STRING(40), allowNull: false },
        originalValue: { type: S.TEXT, allowNull: false },
        proposedValue: { type: S.TEXT, allowNull: false },
        sourceUrl: { type: S.STRING(2048), allowNull: true },
        note: { type: S.TEXT, allowNull: false, defaultValue: '' },
        status: { type: S.STRING(24), allowNull: false, defaultValue: 'pending' },
        reviewNote: { type: S.TEXT, allowNull: false, defaultValue: '' },
        revision: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
        reviewedAt: { type: S.DATE, allowNull: true },
        createdAt: { type: S.DATE, allowNull: false },
        updatedAt: { type: S.DATE, allowNull: false },
      }, { transaction });
      await queryInterface.addIndex('LocationImprovements', ['locationId', 'status', 'createdAt'], { transaction });
      await queryInterface.addIndex('LocationImprovements', ['authorId'], { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.dropTable('LocationImprovements', { transaction });
      if (queryInterface.sequelize.getDialect() === 'sqlite') {
        // Sequelize's SQLite table rebuild cannot describe legacy location indexes.
        await queryInterface.sequelize.query('ALTER TABLE "Locations" DROP COLUMN "description"', { transaction });
      } else {
        await queryInterface.removeColumn('Locations', 'description', { transaction });
      }
    });
  },
};
