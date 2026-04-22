'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('CountryAccessRules');
    if (!table.redirectPath) {
      await queryInterface.addColumn('CountryAccessRules', 'redirectPath', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('CountryAccessRules');
    if (table.redirectPath) {
      await queryInterface.removeColumn('CountryAccessRules', 'redirectPath');
    }
  },
};
