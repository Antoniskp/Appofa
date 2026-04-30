const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * UserLocationRole — join table for location-scoped user role assignments.
 *
 * Stores platform-level role assignments (e.g. 'moderator') for a given user
 * at a specific location.  Separate from LocationRole which stores predefined
 * civic positions (mayor, regional_governor, …).
 *
 * Rules enforced at the service layer:
 *   - A user may only be assigned as 'moderator' for locations that are
 *     ancestors (or the exact home) of their homeLocationId.
 *   - Multiple locations per user per roleKey are intentionally allowed.
 */
const UserLocationRole = sequelize.define('UserLocationRole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Locations', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  roleKey: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Platform role key, e.g. "moderator"',
  },
}, {
  tableName: 'UserLocationRoles',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'locationId', 'roleKey'],
      name: 'idx_user_location_roles_unique',
    },
    { fields: ['userId'], name: 'idx_user_location_roles_user_id' },
    { fields: ['locationId'], name: 'idx_user_location_roles_location_id' },
    { fields: ['roleKey'], name: 'idx_user_location_roles_role_key' },
  ],
});

module.exports = UserLocationRole;
