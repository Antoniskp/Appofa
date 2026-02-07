const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vote = sequelize.define('Vote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pollId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Polls',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  optionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'PollOptions',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'Nullable for free-text responses'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'Nullable for unauthenticated votes'
  },
  isAuthenticated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  rankPosition: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'For ranked choice voting (1=first choice, 2=second choice, etc.)'
  },
  freeTextResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'For free-text answers'
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'For tracking unauthenticated votes'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'For basic duplicate prevention'
  }
}, {
  timestamps: true
});

module.exports = Vote;
