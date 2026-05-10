'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Users');

    if (!columns.resetPasswordTokenHash) {
      await queryInterface.addColumn('Users', 'resetPasswordTokenHash', {
        type: Sequelize.STRING(128),
        allowNull: true,
      });
    }

    if (!columns.resetPasswordExpires) {
      await queryInterface.addColumn('Users', 'resetPasswordExpires', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('Users');

    if (columns.resetPasswordExpires) {
      await queryInterface.removeColumn('Users', 'resetPasswordExpires');
    }

    if (columns.resetPasswordTokenHash) {
      await queryInterface.removeColumn('Users', 'resetPasswordTokenHash');
    }
  },
};
