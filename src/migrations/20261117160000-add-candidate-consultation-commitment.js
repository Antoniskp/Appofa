'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('CandidateRegistrations');
    if (!table.consultationCommitment) await queryInterface.addColumn('CandidateRegistrations', 'consultationCommitment', { type: Sequelize.TEXT, allowNull: true });
  },
  async down(queryInterface) {
    const table = await queryInterface.describeTable('CandidateRegistrations');
    if (table.consultationCommitment) await queryInterface.removeColumn('CandidateRegistrations', 'consultationCommitment');
  },
};
