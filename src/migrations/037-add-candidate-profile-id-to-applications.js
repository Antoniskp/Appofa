'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('CandidateApplications')) return;

    const cols = await queryInterface.describeTable('CandidateApplications');
    if (!cols.candidateProfileId) {
      const colDef = {
        type: Sequelize.INTEGER,
        allowNull: true
      };
      // Only add the FK reference if the CandidateProfiles table exists
      if (tables.includes('CandidateProfiles')) {
        colDef.references = { model: 'CandidateProfiles', key: 'id' };
        colDef.onDelete = 'SET NULL';
      }
      await queryInterface.addColumn('CandidateApplications', 'candidateProfileId', colDef);
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('CandidateApplications')) return;

    const cols = await queryInterface.describeTable('CandidateApplications');
    if (cols.candidateProfileId) {
      await queryInterface.removeColumn('CandidateApplications', 'candidateProfileId');
    }
  }
};
