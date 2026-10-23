'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('IssueFollows', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      entityType: { type: Sequelize.STRING(20), allowNull: false },
      entityId: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('IssueFollows', ['userId', 'entityType', 'entityId'], { unique: true, name: 'issue_follows_user_target_unique' });
  },
  async down(queryInterface) { await queryInterface.dropTable('IssueFollows'); },
};
