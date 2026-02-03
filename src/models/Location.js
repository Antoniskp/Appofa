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
    comment: 'Local language name (optional)'
  },
  type: {
    type: DataTypes.ENUM('international', 'country', 'prefecture', 'municipality'),
    allowNull: false,
    comment: 'Hierarchical location type'
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Locations',
      key: 'id'
    },
    comment: 'Parent location ID for hierarchical structure'
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ISO code, GADM code, or official identifier'
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
      name: 'unique_location_hierarchy'
    },
    {
      fields: ['parent_id'],
      name: 'parent_id_index'
    },
    {
      fields: ['type'],
      name: 'type_index'
    },
    {
      fields: ['code'],
      name: 'code_index'
    }
  ]
});

module.exports = Location;
