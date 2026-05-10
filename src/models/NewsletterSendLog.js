const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewsletterSendLog = sequelize.define('NewsletterSendLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'NewsletterCampaigns',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  subscriberId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'NewsletterSubscribers',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    set(value) {
      this.setDataValue('email', typeof value === 'string' ? value.trim().toLowerCase() : value);
    },
  },
  status: {
    type: DataTypes.ENUM('queued', 'sent', 'failed'),
    allowNull: false,
    defaultValue: 'queued',
  },
  providerMessageId: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'NewsletterSendLogs',
  timestamps: true,
  indexes: [
    { fields: ['campaignId'] },
    { fields: ['subscriberId'] },
    { fields: ['email'] },
    { fields: ['status'] },
    { fields: ['sentAt'] },
  ],
});

module.exports = NewsletterSendLog;
