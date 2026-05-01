const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const { normalizeProfessions, normalizeExpertiseTags } = require('../utils/professionTaxonomy');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true  // Allow null for OAuth-only accounts
  },
  role: {
    type: DataTypes.ENUM('admin', 'moderator', 'editor', 'viewer', 'candidate'),
    defaultValue: 'viewer',
    allowNull: false
  },
  firstNameNative: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  lastNameNative: {
    type: DataTypes.STRING(100),
    allowNull: true
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
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  githubAvatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  googleAvatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatarUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL of the uploaded/optimized profile avatar'
  },
  avatarUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp of the last avatar upload'
  },
  avatarColor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  githubId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  githubAccessToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  googleAccessToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  homeLocationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Locations',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  searchable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  profileCommentsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  profileCommentsLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  mobileTel: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  socialLinks: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('socialLinks');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (err) {
        console.error('Failed to parse socialLinks JSON:', err.message);
        return null;
      }
    },
    set(val) {
      this.setDataValue('socialLinks', val ? JSON.stringify(val) : null);
    }
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  professions: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('professions');
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return normalizeProfessions(parsed);
      } catch (err) {
        console.error('Failed to parse professions JSON:', err.message);
        return [];
      }
    },
    set(val) {
      this.setDataValue('professions', val && val.length > 0 ? JSON.stringify(val) : null);
    }
  },
  interests: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('interests');
      if (!raw) return [];
      try { return JSON.parse(raw); } catch (err) {
        console.error('Failed to parse interests JSON:', err.message);
        return [];
      }
    },
    set(val) {
      this.setDataValue('interests', val && val.length > 0 ? JSON.stringify(val) : null);
    }
  },
  expertiseArea: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('expertiseArea');
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return normalizeExpertiseTags(parsed);
      } catch (err) {
        console.error('Failed to parse expertiseArea JSON:', err.message);
        return [];
      }
    },
    set(val) {
      this.setDataValue('expertiseArea', val && val.length > 0 ? JSON.stringify(val) : null);
    }
  },
  partyId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  twitchChannel: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verifiedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  verifiedScopeLocationId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  displayBadgeSlug: {
    type: DataTypes.STRING,
    allowNull: true
  },
  displayBadgeTier: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notificationPreferences: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('notificationPreferences');
      if (!raw) return {};
      try { return JSON.parse(raw); } catch { return {}; }
    },
    set(val) {
      this.setDataValue(
        'notificationPreferences',
        val && Object.keys(val).length > 0 ? JSON.stringify(val) : null
      );
    }
  },
  nationality: {
    type: DataTypes.STRING(5),
    allowNull: true
  },
  isDiaspora: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  residenceCountryCode: {
    type: DataTypes.STRING(5),
    allowNull: true
  },
  // ─── Person profile fields (for unclaimed/claimed public person profiles) ────
  slug: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  photo: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  politicalPositions: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('politicalPositions');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    },
    set(val) {
      this.setDataValue('politicalPositions', val ? JSON.stringify(val) : null);
    }
  },
  manifesto: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  countryCode: {
    type: DataTypes.STRING(5),
    allowNull: true
  },
  constituencyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Locations', key: 'id' },
    onDelete: 'SET NULL'
  },
  source: {
    type: DataTypes.ENUM('moderator', 'application', 'self'),
    allowNull: true,
    defaultValue: null
  },
  // ─── Claim fields ─────────────────────────────────────────────────────────
  claimStatus: {
    type: DataTypes.ENUM('unclaimed', 'pending', 'claimed', 'rejected'),
    allowNull: true,
    defaultValue: null
    // null = regular user, never involved in claim flow
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
  displayName: {
    type: DataTypes.VIRTUAL,
    get() {
      const native = `${this.firstNameNative || ''} ${this.lastNameNative || ''}`.trim();
      if (native) return native;
      const en = `${this.firstNameEn || ''} ${this.lastNameEn || ''}`.trim();
      if (en) return en;
      return this.username || '';
    }
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
