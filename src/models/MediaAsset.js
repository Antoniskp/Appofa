const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MEDIA_USAGE_TYPES = ['shared', 'article_banner', 'article_body'];
const MEDIA_STATUSES = ['active', 'archived'];

const MediaAsset = sequelize.define('MediaAsset', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  storageProvider: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'local',
  },
  storageKey: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true,
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  usageType: {
    type: DataTypes.ENUM(...MEDIA_USAGE_TYPES),
    allowNull: false,
    defaultValue: 'shared',
  },
  status: {
    type: DataTypes.ENUM(...MEDIA_STATUSES),
    allowNull: false,
    defaultValue: 'active',
  },
  altText: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  credit: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  uploadedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'MediaAssets',
  timestamps: true,
  indexes: [
    { fields: ['storageProvider'] },
    { fields: ['usageType'] },
    { fields: ['status'] },
    { fields: ['uploadedByUserId'] },
  ],
});

MediaAsset.MEDIA_USAGE_TYPES = MEDIA_USAGE_TYPES;
MediaAsset.MEDIA_STATUSES = MEDIA_STATUSES;

module.exports = MediaAsset;
