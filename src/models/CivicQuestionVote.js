const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CivicQuestionVote = sequelize.define('CivicQuestionVote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  civicQuestionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'CivicQuestions',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null for anonymous votes
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  choice: {
    type: DataTypes.ENUM('agree', 'disagree', 'present'),
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  isAuthenticated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'CivicQuestionVotes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['civicQuestionId', 'userId'],
      name: 'unique_user_vote_per_civic_question',
      where: {
        userId: {
          [sequelize.Sequelize.Op.ne]: null,
        },
      },
    },
    {
      // Device fingerprint: prevent same device from voting multiple times
      unique: true,
      fields: ['civicQuestionId', 'ipAddress', 'userAgent'],
      name: 'unique_device_vote_per_civic_question',
      where: {
        userId: null,
        isAuthenticated: false,
      },
    },
    { fields: ['civicQuestionId'] },
    { fields: ['userId'] },
  ],
});

module.exports = CivicQuestionVote;
