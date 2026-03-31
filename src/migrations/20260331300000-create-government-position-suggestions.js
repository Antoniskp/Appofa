'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GovernmentPositionSuggestions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      positionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'GovernmentPositions', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      personId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'PublicPersonProfiles', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      reason: { type: Sequelize.TEXT, allowNull: true },
      order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('GovernmentPositionSuggestions', ['positionId'], {
      name: 'idx_gps_position_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('GovernmentPositionSuggestions');
  },
};
