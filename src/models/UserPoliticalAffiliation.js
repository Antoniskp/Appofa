const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * UserPoliticalAffiliation — tracks a user's affiliation with a political party organization.
 *
 * A user may have zero or more affiliations, each with an endorsement level
 * ('active', 'passive', 'neutral').  The associated organization must have
 * type='party'.
 *
 * This replaces the legacy `User.partyId` string (which pointed at the
 * hard-coded `config/politicalParties.json` file) with a proper relational
 * link to the `Organizations` table.
 */
const UserPoliticalAffiliation = sequelize.define('UserPoliticalAffiliation', {
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
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Organizations', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  endorsementLevel: {
    type: DataTypes.ENUM('active', 'passive', 'neutral'),
    allowNull: false,
    defaultValue: 'neutral',
  },
}, {
  tableName: 'UserPoliticalAffiliations',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'organizationId'], name: 'idx_user_political_affil_unique' },
    { fields: ['userId'], name: 'idx_user_political_affil_user_id' },
    { fields: ['organizationId'], name: 'idx_user_political_affil_org_id' },
  ],
});

module.exports = UserPoliticalAffiliation;
