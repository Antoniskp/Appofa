'use strict';

module.exports = {
  async up(queryInterface, _Sequelize) {
    const tables = await queryInterface.showAllTables();

    // Drop legacy tables
    if (tables.includes('CandidateApplications')) {
      await queryInterface.dropTable('CandidateApplications');
    }
    if (tables.includes('CandidateProfiles')) {
      await queryInterface.dropTable('CandidateProfiles');
    }

    // Remove candidate-specific columns from PublicPersonProfiles
    if (tables.includes('PublicPersonProfiles')) {
      const cols = await queryInterface.describeTable('PublicPersonProfiles');
      for (const col of ['isActiveCandidate', 'appointedAt', 'appointedByUserId', 'retiredAt']) {
        if (cols[col]) {
          await queryInterface.removeColumn('PublicPersonProfiles', col);
        }
      }
    }
  },

  async down(_queryInterface, _Sequelize) {
    // Not implementing full rollback as this is a simplification migration
  }
};
