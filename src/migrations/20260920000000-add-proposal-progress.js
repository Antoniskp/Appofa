'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Suggestions');
    if (!columns.progress) await queryInterface.addColumn('Suggestions', 'progress', { type: Sequelize.JSON, allowNull: true });
  },
  async down(queryInterface) {
    const columns = await queryInterface.describeTable('Suggestions');
    if (columns.progress) await queryInterface.removeColumn('Suggestions', 'progress');
  },
};
