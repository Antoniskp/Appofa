'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('CandidateRegistrations');
    if (!table.reviewNotes) {
      await queryInterface.addColumn('CandidateRegistrations', 'reviewNotes', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('CandidateRegistrations');
    if (table.reviewNotes) {
      await queryInterface.removeColumn('CandidateRegistrations', 'reviewNotes');
    }
  },
};
