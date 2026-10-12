'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('CivicQuestions');
    for (const [name, type] of Object.entries({
      officialTitle: Sequelize.TEXT,
      sourceStatus: Sequelize.STRING,
      sourceCheckedAt: Sequelize.DATE,
    })) {
      if (!columns[name]) await queryInterface.addColumn('CivicQuestions', name, { type, allowNull: true });
    }
  },
  async down(queryInterface) {
    const columns = await queryInterface.describeTable('CivicQuestions');
    for (const name of ['officialTitle', 'sourceStatus', 'sourceCheckedAt']) {
      if (columns[name]) await queryInterface.removeColumn('CivicQuestions', name);
    }
  },
};
