const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
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
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
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
    type: DataTypes.STRING(280),
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
      try { return JSON.parse(raw); } catch (err) {
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
      try { return JSON.parse(raw); } catch (err) {
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
