const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrganizationMember = sequelize.define('OrganizationMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Organizations', key: 'id' },
    onDelete: 'CASCADE',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE',
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'moderator', 'member'),
    allowNull: false,
    defaultValue: 'member',
  },
  status: {
    type: DataTypes.ENUM('active', 'invited', 'pending'),
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  tableName: 'OrganizationMembers',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['organizationId', 'userId'], name: 'organization_member_unique' },
    { fields: ['organizationId'], name: 'organization_member_organization_id_index' },
    { fields: ['userId'], name: 'organization_member_user_id_index' },
  ],
});

module.exports = OrganizationMember;
