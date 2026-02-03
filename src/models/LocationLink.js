const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LocationLink = sequelize.define('LocationLink', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  location_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Locations',
      key: 'id'
    },
    comment: 'Reference to Location'
  },
  entity_type: {
    type: DataTypes.ENUM('article', 'user'),
    allowNull: false,
    comment: 'Type of entity linked to location'
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the linked entity'
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['location_id', 'entity_type', 'entity_id'],
      name: 'unique_location_link'
    },
    {
      fields: ['entity_type', 'entity_id']
    },
    {
      fields: ['location_id']
    }
  ]
});

module.exports = LocationLink;
