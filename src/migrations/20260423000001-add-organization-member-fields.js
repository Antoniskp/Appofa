'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('OrganizationMembers');

    if (!columns.inviteToken) {
      await queryInterface.addColumn('OrganizationMembers', 'inviteToken', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!columns.invitedByUserId) {
      await queryInterface.addColumn('OrganizationMembers', 'invitedByUserId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('OrganizationMembers');

    if (columns.invitedByUserId) {
      await queryInterface.removeColumn('OrganizationMembers', 'invitedByUserId');
    }

    if (columns.inviteToken) {
      await queryInterface.removeColumn('OrganizationMembers', 'inviteToken');
    }
  },
};
