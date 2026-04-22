'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('GeoVisits');
    if (!table.userId) {
      await queryInterface.addColumn('GeoVisits', 'userId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('GeoVisits');
    if (table.userId) {
      await queryInterface.removeColumn('GeoVisits', 'userId');
    }
  },
};
