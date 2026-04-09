'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Who receives the notification
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE'
  },
  // Who triggered it (null = system notification)
  actorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL'
  },
  // Notification type — extensible for future messaging types
  type: {
    type: DataTypes.ENUM(
      'article_approved',
      'article_commented',
      'article_liked',
      'new_follower',
      'endorsement_received',
      'poll_result',
      'badge_earned',
      'mention',
      'report_resolved',
      'system_announcement'
      // Future: 'new_message', 'message_reply' — add to ENUM when messaging lands
    ),
    allowNull: false
  },
  // Polymorphic entity reference
  entityType: {
    type: DataTypes.ENUM('article', 'comment', 'poll', 'user', 'badge', 'message'),
    allowNull: true
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Human-readable content
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Deep-link for frontend navigation
  actionUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Extra data (e.g. article title, commenter username)
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'Notifications',
  indexes: [
    { fields: ['userId', 'isRead'] },        // fast unread count queries
    { fields: ['userId', 'createdAt'] },     // fast paginated feed
    { fields: ['entityType', 'entityId'] }   // reverse-lookup
  ]
});

module.exports = Notification;
