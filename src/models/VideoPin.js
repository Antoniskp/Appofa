const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CONTENT_TYPES = ['live', 'viral'];
const CATEGORIES = [
  'local-news',
  'traffic',
  'weather',
  'events',
  'safety',
  'community',
  'other'
];
const STATUSES = ['pending', 'approved', 'hidden', 'broken', 'ended', 'expired', 'removed'];

const VideoPin = sequelize.define('VideoPin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contentType: {
    type: DataTypes.ENUM(...CONTENT_TYPES),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM(...CATEGORIES),
    allowNull: false,
    defaultValue: 'local-news'
  },
  status: {
    type: DataTypes.ENUM(...STATUSES),
    allowNull: false,
    defaultValue: 'pending'
  },
  sourceProvider: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  sourceUrl: {
    type: DataTypes.STRING(2048),
    allowNull: false
  },
  canonicalUrl: {
    type: DataTypes.STRING(2048),
    allowNull: true
  },
  providerVideoId: {
    type: DataTypes.STRING(128),
    allowNull: true
  },
  creatorHandle: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  creatorName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  creatorUrl: {
    type: DataTypes.STRING(2048),
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
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
  sourceMeta: {
    type: DataTypes.JSON,
    allowNull: true
  },
  lat: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false
  },
  lng: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Locations',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  submittedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  moderatedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  moderatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['status', 'contentType'], name: 'video_pins_status_content_type_idx' },
    { fields: ['category', 'status'], name: 'video_pins_category_status_idx' },
    { fields: ['sourceProvider', 'providerVideoId'], name: 'video_pins_provider_video_id_idx' },
    { fields: ['creatorHandle', 'status'], name: 'video_pins_creator_status_idx' },
    { fields: ['contentType', 'expiresAt'], name: 'video_pins_content_expires_idx' },
    { fields: ['status', 'createdAt'], name: 'video_pins_status_created_at_idx' },
    { fields: ['locationId', 'status'], name: 'video_pins_location_status_idx' }
  ]
});

VideoPin.CONTENT_TYPES = CONTENT_TYPES;
VideoPin.CATEGORIES = CATEGORIES;
VideoPin.STATUSES = STATUSES;

module.exports = VideoPin;
