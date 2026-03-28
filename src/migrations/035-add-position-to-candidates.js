'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    const columnDef = dialect === 'sqlite'
      ? { type: Sequelize.STRING(30), allowNull: true }
      : { type: Sequelize.ENUM('mayor', 'prefect', 'parliamentary'), allowNull: true };

    await queryInterface.addColumn('CandidateProfiles', 'position', columnDef);
    await queryInterface.addColumn('CandidateApplications', 'position', columnDef);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('CandidateProfiles', 'position');
    await queryInterface.removeColumn('CandidateApplications', 'position');
  }
};
