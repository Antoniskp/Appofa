const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SuggestionVote = sequelize.define('SuggestionVote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  targetType: {
    type: DataTypes.ENUM('suggestion', 'solution'),
    allowNull: false
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  value: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    validate: {
      isIn: [[-1, 1]]
    }
  }
}, {
  timestamps: true,
  tableName: 'SuggestionVotes',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'targetType', 'targetId'],
      name: 'unique_user_suggestion_vote'
    },
    { fields: ['targetType', 'targetId'] }
  ]
});

module.exports = SuggestionVote;
