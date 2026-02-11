const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModeratorApplication = sequelize.define('ModeratorApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('moderator_application', 'contact'),
    defaultValue: 'moderator_application',
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for contact messages from non-logged-in users
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Not required for contact messages
    references: {
      model: 'Locations',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true // For contact messages from non-logged-in users
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true // For contact messages from non-logged-in users
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true // For contact messages
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true // For contact messages
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true // For moderator applications
  },
  experience: {
    type: DataTypes.TEXT,
    allowNull: true // For moderator applications
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'read', 'archived'),
    defaultValue: 'pending',
    allowNull: false
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'ModeratorApplications'
});

module.exports = ModeratorApplication;
