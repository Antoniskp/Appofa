const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CandidateRegistration = sequelize.define('CandidateRegistration', {
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
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Locations', key: 'id' },
    onDelete: 'CASCADE',
  },
  positionType: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  positionTitle: {
    type: DataTypes.STRING(160),
    allowNull: true,
  },
  electionCycle: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },
  partyName: {
    type: DataTypes.STRING(160),
    allowNull: true,
  },
  isIndependent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  slogan: {
    type: DataTypes.STRING(180),
    allowNull: true,
  },
  platform: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  websiteUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  contactEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'submitted',
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
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'locationId', 'positionType', 'electionCycle'],
      name: 'idx_candidate_registrations_unique_active',
    },
    {
      fields: ['locationId', 'status'],
      name: 'idx_candidate_registrations_location_status',
    },
    {
      fields: ['userId'],
      name: 'idx_candidate_registrations_user_id',
    },
  ],
});

module.exports = CandidateRegistration;
