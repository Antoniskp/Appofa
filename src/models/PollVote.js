const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PollVote = sequelize.define('PollVote', {
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
    allowNull: false,
    references: {
      model: 'PollOptions',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  isAuthenticated: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'PollVotes',
  indexes: [
    {
      unique: true,
      fields: ['pollId', 'userId'],
      name: 'unique_user_vote_per_poll',
      where: {
        userId: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      // Device fingerprint: prevent same device from voting multiple times on anonymous polls
      unique: true,
      fields: ['pollId', 'ipAddress', 'userAgent'],
      name: 'unique_device_vote_per_poll',
      where: {
        userId: null,
        isAuthenticated: false
      }
    }
  ]
});

module.exports = PollVote;
