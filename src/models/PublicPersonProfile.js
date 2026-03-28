const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PublicPersonProfile = sequelize.define('PublicPersonProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Locations', key: 'id' },
    onDelete: 'SET NULL'
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
  photo: {
    type: DataTypes.STRING(500),
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
  fullName: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.firstName || ''} ${this.lastName || ''}`.trim();
    }
  },
  claimStatus: {
    type: DataTypes.ENUM('unclaimed', 'pending', 'claimed', 'rejected'),
    defaultValue: 'unclaimed',
    allowNull: false
  },
  claimedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL'
  },
  claimRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  claimVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  claimVerifiedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL'
  },
  claimToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  claimTokenExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL'
  },
  source: {
    type: DataTypes.ENUM('moderator', 'application', 'self'),
    defaultValue: 'moderator',
    allowNull: false
  },
  position: {
    type: DataTypes.ENUM('mayor', 'prefect', 'parliamentary'),
    allowNull: true
  },
  isActiveCandidate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  appointedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  appointedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL'
  },
  retiredAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'PublicPersonProfiles',
  timestamps: true
});

module.exports = PublicPersonProfile;
