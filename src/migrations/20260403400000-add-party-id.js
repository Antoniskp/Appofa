'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'partyId', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('PublicPersonProfiles', 'partyId', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('Suggestions', 'partyId', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'partyId');
    await queryInterface.removeColumn('PublicPersonProfiles', 'partyId');
    await queryInterface.removeColumn('Suggestions', 'partyId');
  },
};
