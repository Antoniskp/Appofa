'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      actorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM(
          'article_approved', 'article_commented', 'article_liked',
          'new_follower', 'endorsement_received',
          'poll_result', 'badge_earned',
          'mention', 'report_resolved', 'system_announcement'
        ),
        allowNull: false
      },
      entityType: {
        type: Sequelize.ENUM('article', 'comment', 'poll', 'user', 'badge', 'message'),
        allowNull: true
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      actionUrl: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('Notifications', ['userId', 'isRead'],     { name: 'notifications_user_read' });
    await queryInterface.addIndex('Notifications', ['userId', 'createdAt'],  { name: 'notifications_user_created' });
    await queryInterface.addIndex('Notifications', ['entityType', 'entityId'], { name: 'notifications_entity' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Notifications');
    // Drop ENUM types for PostgreSQL
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Notifications_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Notifications_entityType";');
  }
};
