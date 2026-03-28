'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    const columnDef = dialect === 'sqlite'
      ? { type: Sequelize.STRING(30), allowNull: true }
      : { type: Sequelize.ENUM('mayor', 'prefect', 'parliamentary'), allowNull: true };

    // These columns are included in the initial PublicPersonProfiles migration
    // but we keep these steps for databases that were created before the rename.
    const tables = await queryInterface.showAllTables();

    if (tables.includes('PublicPersonProfiles')) {
      const pppCols = await queryInterface.describeTable('PublicPersonProfiles');
      if (!pppCols.position) {
        await queryInterface.addColumn('PublicPersonProfiles', 'position', columnDef);
      }
    }

    if (tables.includes('CandidateApplications')) {
      const appCols = await queryInterface.describeTable('CandidateApplications');
      if (!appCols.position) {
        await queryInterface.addColumn('CandidateApplications', 'position', columnDef);
      }
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();

    if (tables.includes('PublicPersonProfiles')) {
      const pppCols = await queryInterface.describeTable('PublicPersonProfiles');
      if (pppCols.position) {
        await queryInterface.removeColumn('PublicPersonProfiles', 'position');
      }
    }

    if (tables.includes('CandidateApplications')) {
      const appCols = await queryInterface.describeTable('CandidateApplications');
      if (appCols.position) {
        await queryInterface.removeColumn('CandidateApplications', 'position');
      }
    }
  }
};
