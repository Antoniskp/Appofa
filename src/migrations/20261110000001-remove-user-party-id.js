'use strict';

module.exports = {
  async up(queryInterface) {
    const columns = await queryInterface.describeTable('Users');
    if (columns.partyId) await queryInterface.removeColumn('Users', 'partyId');
  },

  async down(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Users');
    if (!columns.partyId) {
      await queryInterface.addColumn('Users', 'partyId', {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }
  },
};
