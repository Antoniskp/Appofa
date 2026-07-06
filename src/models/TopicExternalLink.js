const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TopicExternalLink = sequelize.define('TopicExternalLink', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  topicId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING(2048),
    allowNull: false
  },
  provider: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'website'
  },
  sourceType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'link'
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  thumbnailUrl: {
    type: DataTypes.STRING(2048),
    allowNull: true
  },
  embedUrl: {
    type: DataTypes.STRING(2048),
    allowNull: true
  },
  embedHtml: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'approved'
  },
  submittedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'TopicExternalLinks',
  indexes: [
    { fields: ['topicId', 'status'], name: 'topic_external_links_topic_status_idx' },
    { fields: ['provider'], name: 'topic_external_links_provider_idx' }
  ]
});

module.exports = TopicExternalLink;
