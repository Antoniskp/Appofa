'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('CivicQuestions').catch(() => null);
    if (!tableDesc) return;

    if (!tableDesc.commissionRequirement) {
      await queryInterface.addColumn('CivicQuestions', 'commissionRequirement', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('CivicQuestions').catch(() => null);
    if (!tableDesc || !tableDesc.commissionRequirement) return;

    await queryInterface.removeColumn('CivicQuestions', 'commissionRequirement');
  },
};
