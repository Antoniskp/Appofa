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
  firstNameNative: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  lastNameNative: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  firstNameEn: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  lastNameEn: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  nickname: {
    type: DataTypes.STRING(100),
    allowNull: true
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
  expertiseArea: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('expertiseArea');
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('expertiseArea', value && value.length > 0 ? JSON.stringify(value) : null);
    }
  },
  partyId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  fullNameNative: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.firstNameNative || ''} ${this.lastNameNative || ''}`.trim();
    }
  },
  fullNameEn: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.firstNameEn || ''} ${this.lastNameEn || ''}`.trim();
    }
  },
  fullName: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.firstNameNative || ''} ${this.lastNameNative || ''}`.trim();
    }
  },
  displayName: {
    type: DataTypes.VIRTUAL,
    get() {
      const native = `${this.firstNameNative || ''} ${this.lastNameNative || ''}`.trim();
      if (native) return native;
      const en = `${this.firstNameEn || ''} ${this.lastNameEn || ''}`.trim();
      if (en) return en;
      return this.slug || '';
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
  placeholderUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL'
  },
  source: {
    type: DataTypes.ENUM('moderator', 'application', 'self'),
    defaultValue: 'moderator',
    allowNull: false
  }
}, {
  tableName: 'PublicPersonProfiles',
  timestamps: true
});

module.exports = PublicPersonProfile;
