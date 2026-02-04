const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Official name of the location'
  },
  name_local: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Local language name of the location'
  },
  type: {
    type: DataTypes.ENUM('international', 'country', 'prefecture', 'municipality'),
    allowNull: false
    // Comment moved to post-sync hook to avoid Sequelize bug #17894
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Locations',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'Parent location ID for hierarchical structure'
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'ISO or official code (e.g., ISO country code, GADM code)'
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'URL-friendly identifier'
  },
  lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    comment: 'Latitude coordinate'
  },
  lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    comment: 'Longitude coordinate'
  },
  bounding_box: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Optional bounding box for map display: {north, south, east, west}'
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['type', 'name', 'parent_id'],
      name: 'unique_location_name_per_parent'
    },
    {
      fields: ['code'],
      name: 'location_code_index'
    },
    {
      fields: ['parent_id'],
      name: 'location_parent_index'
    },
    {
      fields: ['slug'],
      name: 'location_slug_index'
    }
  ]
});

module.exports = Location;
