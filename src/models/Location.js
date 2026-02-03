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
    comment: 'Official location name'
  },
  name_local: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Local/native language name'
  },
  type: {
    type: DataTypes.ENUM('international', 'country', 'prefecture', 'municipality'),
    allowNull: false,
    comment: 'Type of location in hierarchy'
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Locations',
      key: 'id'
    },
    comment: 'Parent location for hierarchical structure'
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ISO code or official code (e.g., GR, GR-A for Attica)'
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
    comment: 'Bounding box for map visualization: {north, south, east, west}'
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['type', 'name', 'parent_id'],
      name: 'unique_location_constraint'
    },
    {
      fields: ['slug']
    },
    {
      fields: ['parent_id']
    },
    {
      fields: ['code']
    }
  ]
});

module.exports = Location;
