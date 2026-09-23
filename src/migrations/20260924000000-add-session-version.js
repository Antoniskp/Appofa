'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Users');
    if (!columns.sessionVersion) {
      await queryInterface.addColumn('Users', 'sessionVersion', {
        type: Sequelize.STRING(36), allowNull: false, defaultValue: '0',
      });
    }
  },
  async down(queryInterface) {
    const columns = await queryInterface.describeTable('Users');
    if (columns.sessionVersion) await queryInterface.removeColumn('Users', 'sessionVersion');
  },
};
