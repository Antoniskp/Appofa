'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('PollOptions', 'mediaAssetId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'MediaAssets',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('PollOptions', ['mediaAssetId']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('PollOptions', ['mediaAssetId']);
    await queryInterface.removeColumn('PollOptions', 'mediaAssetId');
  },
};
