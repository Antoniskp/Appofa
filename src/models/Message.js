const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('contact', 'moderator_application', 'general', 'bug_report', 'feature_request'),
    allowNull: false,
    defaultValue: 'contact'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [1, 200]
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Locations',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'read', 'in_progress', 'responded', 'archived'),
    defaultValue: 'pending',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal',
    allowNull: false
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  respondedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'Messages'
});

module.exports = Message;
