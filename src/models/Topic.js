const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Topic = sequelize.define('Topic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tagId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(140),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  aliases: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  heroImageUrl: {
    type: DataTypes.STRING(2048),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'active'
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  createdByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  updatedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'Topics',
  indexes: [
    { fields: ['slug'], name: 'topics_slug_idx' },
    { fields: ['status', 'isFeatured'], name: 'topics_status_featured_idx' }
  ]
});

module.exports = Topic;
