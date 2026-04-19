'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const usersColumns = await queryInterface.describeTable('Users');
    if (!usersColumns.nationality) {
      await queryInterface.addColumn('Users', 'nationality', {
        type: Sequelize.STRING(5),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const usersColumns = await queryInterface.describeTable('Users');
    if (usersColumns.nationality) {
      await queryInterface.removeColumn('Users', 'nationality');
    }
  },
};
