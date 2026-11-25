'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('CandidateRegistrations');
    if (!table.source) {
      await queryInterface.addColumn('CandidateRegistrations', 'source', {
        type: Sequelize.STRING(30),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('CandidateRegistrations');
    if (table.source) await queryInterface.removeColumn('CandidateRegistrations', 'source');
  },
};
