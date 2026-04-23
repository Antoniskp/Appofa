'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Suggestions');

    if (!columns.organizationId) {
      await queryInterface.addColumn('Suggestions', 'organizationId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Organizations', key: 'id' },
        onDelete: 'SET NULL',
      });
    }

    const indexes = await queryInterface.showIndex('Suggestions');
    const hasOrganizationIndex = indexes.some((index) => index.name === 'suggestions_organization_id_index');
    if (!hasOrganizationIndex) {
      await queryInterface.addIndex('Suggestions', ['organizationId'], {
        name: 'suggestions_organization_id_index',
      });
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('Suggestions');
    const hasOrganizationIndex = indexes.some((index) => index.name === 'suggestions_organization_id_index');
    if (hasOrganizationIndex) {
      await queryInterface.removeIndex('Suggestions', 'suggestions_organization_id_index');
    }

    const columns = await queryInterface.describeTable('Suggestions');
    if (columns.organizationId) {
      await queryInterface.removeColumn('Suggestions', 'organizationId');
    }
  },
};
