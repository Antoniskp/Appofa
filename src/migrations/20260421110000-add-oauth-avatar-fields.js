'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Users');

    if (!columns.githubAvatar) {
      await queryInterface.addColumn('Users', 'githubAvatar', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!columns.googleAvatar) {
      await queryInterface.addColumn('Users', 'googleAvatar', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('Users');

    if (columns.googleAvatar) {
      await queryInterface.removeColumn('Users', 'googleAvatar');
    }

    if (columns.githubAvatar) {
      await queryInterface.removeColumn('Users', 'githubAvatar');
    }
  },
};
