const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.ENUM('company', 'organization', 'institution', 'school', 'university', 'party'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  logo: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  contactEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Locations', key: 'id' },
    onDelete: 'SET NULL',
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Organizations', key: 'id' },
    onDelete: 'SET NULL',
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  createdByUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'Organizations',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['slug'], name: 'organization_slug_unique' },
    { fields: ['type'], name: 'organization_type_index' },
    { fields: ['locationId'], name: 'organization_location_id_index' },
    { fields: ['parentId'], name: 'organization_parent_id_index' },
    { fields: ['createdByUserId'], name: 'organization_created_by_user_id_index' },
  ],
});

module.exports = Organization;
