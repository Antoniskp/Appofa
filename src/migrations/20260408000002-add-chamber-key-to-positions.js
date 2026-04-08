'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('GovernmentPositions');
    if (!columns.chamberKey) {
      await queryInterface.addColumn('GovernmentPositions', 'chamberKey', {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('GovernmentPositions');
    if (columns.chamberKey) {
      await queryInterface.removeColumn('GovernmentPositions', 'chamberKey');
    }
  },
};
