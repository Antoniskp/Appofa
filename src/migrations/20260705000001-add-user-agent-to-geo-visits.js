'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('GeoVisits');
    if (!table.userAgent) {
      await queryInterface.addColumn('GeoVisits', 'userAgent', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('GeoVisits');
    if (table.userAgent) {
      await queryInterface.removeColumn('GeoVisits', 'userAgent');
    }
  },
};
