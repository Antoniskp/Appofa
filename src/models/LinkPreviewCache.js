const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LinkPreviewCache = sequelize.define('LinkPreviewCache', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  normalizedUrl: {
    type: DataTypes.STRING(2048),
    allowNull: false,
    unique: true
  },
  provider: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  authorName: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  thumbnailUrl: {
    type: DataTypes.STRING(2048),
    allowNull: true
  },
  providerName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  providerUrl: {
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
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = LinkPreviewCache;
