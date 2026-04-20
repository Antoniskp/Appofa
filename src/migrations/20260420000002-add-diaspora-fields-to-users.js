'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Users');

    if (!columns.isDiaspora) {
      await queryInterface.addColumn('Users', 'isDiaspora', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    if (!columns.residenceCountryCode) {
      await queryInterface.addColumn('Users', 'residenceCountryCode', {
        type: Sequelize.STRING(5),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('Users');

    if (columns.residenceCountryCode) {
      await queryInterface.removeColumn('Users', 'residenceCountryCode');
    }

    if (columns.isDiaspora) {
      await queryInterface.removeColumn('Users', 'isDiaspora');
    }
  },
};
