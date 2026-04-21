'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('GeoVisits');
    if (!table.ipAddress) {
      await queryInterface.addColumn('GeoVisits', 'ipAddress', {
        type: Sequelize.STRING(45),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('GeoVisits');
    if (table.ipAddress) {
      await queryInterface.removeColumn('GeoVisits', 'ipAddress');
    }
  },
};
