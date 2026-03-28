const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CandidateApplication = sequelize.define('CandidateApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  applicantUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE'
  },
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  constituencyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Locations', key: 'id' },
    onDelete: 'SET NULL'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  socialLinks: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('socialLinks');
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    set(value) {
      this.setDataValue('socialLinks', value ? JSON.stringify(value) : null);
    }
  },
  politicalPositions: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('politicalPositions');
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    set(value) {
      this.setDataValue('politicalPositions', value ? JSON.stringify(value) : null);
    }
  },
  manifesto: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  supportingStatement: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  reviewedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  candidateProfileId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'CandidateProfiles', key: 'id' },
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'CandidateApplications',
  timestamps: true
});

module.exports = CandidateApplication;
