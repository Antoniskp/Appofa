'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Users');

    if (!columns.emailVerified) {
      await queryInterface.addColumn('Users', 'emailVerified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    if (!columns.emailVerifToken) {
      await queryInterface.addColumn('Users', 'emailVerifToken', {
        type: Sequelize.STRING(128),
        allowNull: true,
      });
    }

    if (!columns.emailVerifExpires) {
      await queryInterface.addColumn('Users', 'emailVerifExpires', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('Users');

    if (columns.emailVerifExpires) {
      await queryInterface.removeColumn('Users', 'emailVerifExpires');
    }

    if (columns.emailVerifToken) {
      await queryInterface.removeColumn('Users', 'emailVerifToken');
    }

    if (columns.emailVerified) {
      await queryInterface.removeColumn('Users', 'emailVerified');
    }
  },
};
