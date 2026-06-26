'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');
    const dialect = queryInterface.sequelize.getDialect();

    if (!tableDescription.politicalAffiliationStatus) {
      await queryInterface.addColumn('Users', 'politicalAffiliationStatus', {
        type: dialect === 'postgres'
          ? Sequelize.ENUM('party', 'unaffiliated', 'prefer_not_to_say', 'other')
          : Sequelize.STRING(30),
        allowNull: true,
      });
    }

    if (!tableDescription.politicalAffiliationOtherText) {
      await queryInterface.addColumn('Users', 'politicalAffiliationOtherText', {
        type: Sequelize.STRING(120),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('Users');

    if (tableDescription.politicalAffiliationOtherText) {
      await queryInterface.removeColumn('Users', 'politicalAffiliationOtherText');
    }

    if (tableDescription.politicalAffiliationStatus) {
      await queryInterface.removeColumn('Users', 'politicalAffiliationStatus');
    }
  },
};
