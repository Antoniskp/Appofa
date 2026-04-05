const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LocationRole = sequelize.define('LocationRole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Locations', key: 'id' },
    onDelete: 'CASCADE',
  },
  roleKey: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Predefined role key, e.g. "mayor", "regional_governor"',
  },
  personId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'PublicPersonProfiles', key: 'id' },
    onDelete: 'SET NULL',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'LocationRoles',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['locationId', 'roleKey'], name: 'idx_location_roles_unique' },
    { fields: ['locationId'], name: 'idx_location_roles_location_id' },
    { fields: ['personId'], name: 'idx_location_roles_person_id' },
    { fields: ['userId'], name: 'idx_location_roles_user_id' },
  ],
});

module.exports = LocationRole;
