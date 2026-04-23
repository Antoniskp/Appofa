'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Polls');

    if (!columns.organizationId) {
      await queryInterface.addColumn('Polls', 'organizationId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Organizations', key: 'id' },
        onDelete: 'SET NULL',
      });
    }

    const indexes = await queryInterface.showIndex('Polls');
    const hasOrganizationIndex = indexes.some((index) => index.name === 'polls_organization_id_index');
    if (!hasOrganizationIndex) {
      await queryInterface.addIndex('Polls', ['organizationId'], {
        name: 'polls_organization_id_index',
      });
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('Polls');
    const hasOrganizationIndex = indexes.some((index) => index.name === 'polls_organization_id_index');
    if (hasOrganizationIndex) {
      await queryInterface.removeIndex('Polls', 'polls_organization_id_index');
    }

    const columns = await queryInterface.describeTable('Polls');
    if (columns.organizationId) {
      await queryInterface.removeColumn('Polls', 'organizationId');
    }
  },
};
