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
    allowNull: false,
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
}, {
  tableName: 'CivicQuestionVotes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['civicQuestionId', 'userId'],
      name: 'unique_user_vote_per_civic_question',
    },
    { fields: ['civicQuestionId'] },
    { fields: ['userId'] },
  ],
});

module.exports = CivicQuestionVote;
