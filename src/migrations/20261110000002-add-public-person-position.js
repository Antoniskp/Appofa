'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Users');
    if (!columns.position) {
      await queryInterface.addColumn('Users', 'position', {
        type: Sequelize.STRING(40),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('Users');
    if (columns.position) await queryInterface.removeColumn('Users', 'position');
  },
};
