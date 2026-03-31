'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('GovernmentCurrentHolders');

    // ── GovernmentCurrentHolders ──────────────────────────────────────────────

    // 1. Add userId FK (nullable) if not already present
    if (!tableInfo.userId) {
      await queryInterface.addColumn('GovernmentCurrentHolders', 'userId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      });
    }

    // 2. Make personId nullable
    if (tableInfo.personId && tableInfo.personId.allowNull === false) {
      await queryInterface.changeColumn('GovernmentCurrentHolders', 'personId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'PublicPersonProfiles', key: 'id' },
        onDelete: 'CASCADE',
      });
    }

    // ── GovernmentPositionSuggestions ─────────────────────────────────────────

    const suggInfo = await queryInterface.describeTable('GovernmentPositionSuggestions');

    // 3. Add userId FK (nullable) if not already present
    if (!suggInfo.userId) {
      await queryInterface.addColumn('GovernmentPositionSuggestions', 'userId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      });
    }

    // 4. Make personId nullable
    if (suggInfo.personId && suggInfo.personId.allowNull === false) {
      await queryInterface.changeColumn('GovernmentPositionSuggestions', 'personId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'PublicPersonProfiles', key: 'id' },
        onDelete: 'CASCADE',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverse: make personId NOT NULL again, remove userId

    const tableInfo = await queryInterface.describeTable('GovernmentCurrentHolders');

    if (tableInfo.userId) {
      await queryInterface.removeColumn('GovernmentCurrentHolders', 'userId');
    }

    if (tableInfo.personId) {
      await queryInterface.changeColumn('GovernmentCurrentHolders', 'personId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'PublicPersonProfiles', key: 'id' },
        onDelete: 'CASCADE',
      });
    }

    const suggInfo = await queryInterface.describeTable('GovernmentPositionSuggestions');

    if (suggInfo.userId) {
      await queryInterface.removeColumn('GovernmentPositionSuggestions', 'userId');
    }

    if (suggInfo.personId) {
      await queryInterface.changeColumn('GovernmentPositionSuggestions', 'personId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'PublicPersonProfiles', key: 'id' },
        onDelete: 'CASCADE',
      });
    }
  },
};
