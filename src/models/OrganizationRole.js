const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * OrganizationRole — public-facing seats/positions within an organization.
 *
 * These are real-world institutional roles (e.g. party leader, school director,
 * professor) and are completely separate from OrganizationMember which models
 * platform-level membership permissions (owner | admin | moderator | member).
 *
 * An OrganizationRole can be assigned to:
 *   - a claimed platform user (userId set, personId null)
 *   - an unclaimed / person-profile placeholder (personId set, userId null;
 *     user has claimStatus IS NOT NULL)
 *   - nobody / vacant (both userId and personId are null)
 *
 * Repeatable roles (e.g. "teacher", "board member") are supported by simply
 * creating multiple rows with the same title.
 */
const OrganizationRole = sequelize.define('OrganizationRole', {
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
    onUpdate: 'CASCADE',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Free-form role name, e.g. "Πρόεδρος", "Διευθυντής", "Καθηγητής"',
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Optional grouping category, e.g. "governance", "staff", "education"',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    comment: 'Claimed platform user assigned to this role (claimStatus IS NULL)',
  },
  personId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    comment: 'Unclaimed/person profile assigned to this role (claimStatus IS NOT NULL)',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isCurrent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'False hides the role from the default public listing (historical tenures)',
  },
}, {
  tableName: 'OrganizationRoles',
  timestamps: true,
  indexes: [
    { fields: ['organizationId'], name: 'idx_org_roles_org_id' },
    { fields: ['userId'], name: 'idx_org_roles_user_id' },
    { fields: ['personId'], name: 'idx_org_roles_person_id' },
    { fields: ['organizationId', 'isCurrent'], name: 'idx_org_roles_org_current' },
  ],
});

module.exports = OrganizationRole;
