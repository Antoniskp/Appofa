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
      fields: ['pollId', 'sessionId']
    }
  ]
});

module.exports = PollVote;
