'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Organizations');

    if (!columns.parentId) {
      await queryInterface.addColumn('Organizations', 'parentId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Organizations', key: 'id' },
        onDelete: 'SET NULL',
      });
    }

    const indexes = await queryInterface.showIndex('Organizations');
    const hasParentIndex = indexes.some((index) => index.name === 'organization_parent_id_index');
    if (!hasParentIndex) {
      await queryInterface.addIndex('Organizations', ['parentId'], {
        name: 'organization_parent_id_index',
      });
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('Organizations');
    const hasParentIndex = indexes.some((index) => index.name === 'organization_parent_id_index');
    if (hasParentIndex) {
      await queryInterface.removeIndex('Organizations', 'organization_parent_id_index');
    }

    const columns = await queryInterface.describeTable('Organizations');
    if (columns.parentId) {
      await queryInterface.removeColumn('Organizations', 'parentId');
    }
  },
};
