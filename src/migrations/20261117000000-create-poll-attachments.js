'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('PollAttachments', {
        id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        pollId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Polls', key: 'id' }, onDelete: 'CASCADE' },
        uploadedByUserId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
        storageKey: { type: Sequelize.STRING(100), allowNull: false },
        thumbnailKey: { type: Sequelize.STRING(100), allowNull: true },
        originalName: { type: Sequelize.STRING(255), allowNull: false },
        mimeType: { type: Sequelize.STRING(100), allowNull: false },
        size: { type: Sequelize.INTEGER, allowNull: false },
        title: { type: Sequelize.STRING(255), allowNull: false },
        caption: { type: Sequelize.STRING(500), allowNull: true },
        order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });
      await queryInterface.addIndex('PollAttachments', ['pollId'], { transaction });
      await queryInterface.addIndex('PollAttachments', ['uploadedByUserId', 'createdAt'], { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('PollAttachments');
  },
};
