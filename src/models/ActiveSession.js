const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActiveSession = sequelize.define('ActiveSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique session identifier'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'User ID if authenticated, null for anonymous'
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Last activity timestamp for session cleanup'
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
      name: 'active_sessions_user_index'
    },
    {
      fields: ['lastActivity'],
      name: 'active_sessions_activity_index'
    }
  ]
});

module.exports = ActiveSession;
