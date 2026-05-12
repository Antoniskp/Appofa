'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Stores Web Push API subscriptions for registered users.
 * Each user may have multiple subscriptions (different browsers/devices).
 * Subscriptions are keyed by their endpoint URL which is globally unique.
 */
const PushSubscription = sequelize.define('PushSubscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE'
  },
  // Full subscription object from pushManager.subscribe() as JSON
  // { endpoint, keys: { p256dh, auth } }
  endpoint: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  p256dh: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  auth: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Optional: user agent string for display in admin
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'PushSubscriptions',
  indexes: [
    { fields: ['userId'] },
    { fields: ['endpoint'], unique: true }
  ]
});

module.exports = PushSubscription;
