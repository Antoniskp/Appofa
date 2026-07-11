const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MEDIA_USAGE_TYPES = ['shared', 'article_cover', 'article_body', 'avatar'];
const MEDIA_ENTITY_TYPES = ['shared', 'article', 'avatar'];
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
  variants: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('variants');
      if (!raw) return {};
      try { return JSON.parse(raw); } catch { return {}; }
    },
    set(value) {
      this.setDataValue('variants', value ? JSON.stringify(value) : null);
    },
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  detectedMimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
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
  entityType: {
    type: DataTypes.ENUM(...MEDIA_ENTITY_TYPES),
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
  caption: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  credit: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('tags');
      if (!raw) return [];
      try { return JSON.parse(raw); } catch { return []; }
    },
    set(value) {
      this.setDataValue('tags', value && value.length ? JSON.stringify(value) : null);
    },
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('metadata');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    },
    set(value) {
      this.setDataValue('metadata', value ? JSON.stringify(value) : null);
    },
  },
  checksumSha256: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isOrphaned: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  orphanedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastReferencedAt: {
    type: DataTypes.DATE,
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
    { fields: ['entityType'] },
    { fields: ['status'] },
    { fields: ['uploadedByUserId'] },
    { fields: ['deletedAt'] },
    { fields: ['isOrphaned'] },
  ],
});

MediaAsset.MEDIA_USAGE_TYPES = MEDIA_USAGE_TYPES;
MediaAsset.MEDIA_ENTITY_TYPES = MEDIA_ENTITY_TYPES;
MediaAsset.MEDIA_STATUSES = MEDIA_STATUSES;

module.exports = MediaAsset;
