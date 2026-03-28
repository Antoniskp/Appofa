'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // These columns are included in the initial PublicPersonProfiles migration.
    // We keep these steps for databases created before the rename.
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('PublicPersonProfiles')) return;

    const cols = await queryInterface.describeTable('PublicPersonProfiles');

    if (!cols.isActiveCandidate) {
      await queryInterface.addColumn('PublicPersonProfiles', 'isActiveCandidate', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    if (!cols.appointedAt) {
      await queryInterface.addColumn('PublicPersonProfiles', 'appointedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!cols.appointedByUserId) {
      await queryInterface.addColumn('PublicPersonProfiles', 'appointedByUserId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      });
    }

    if (!cols.retiredAt) {
      await queryInterface.addColumn('PublicPersonProfiles', 'retiredAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('PublicPersonProfiles')) return;

    const cols = await queryInterface.describeTable('PublicPersonProfiles');
    if (cols.retiredAt) await queryInterface.removeColumn('PublicPersonProfiles', 'retiredAt');
    if (cols.appointedByUserId) await queryInterface.removeColumn('PublicPersonProfiles', 'appointedByUserId');
    if (cols.appointedAt) await queryInterface.removeColumn('PublicPersonProfiles', 'appointedAt');
    if (cols.isActiveCandidate) await queryInterface.removeColumn('PublicPersonProfiles', 'isActiveCandidate');
  }
};
