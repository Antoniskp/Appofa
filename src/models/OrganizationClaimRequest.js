const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrganizationClaimRequest = sequelize.define('OrganizationClaimRequest', {
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
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  roleTitle: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  contactEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  supportingStatement: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  reviewedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL',
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'OrganizationClaimRequests',
  timestamps: true,
  indexes: [
    { fields: ['organizationId'], name: 'organization_claim_org_id_index' },
    { fields: ['userId'], name: 'organization_claim_user_id_index' },
    { fields: ['status'], name: 'organization_claim_status_index' },
  ],
});

module.exports = OrganizationClaimRequest;
