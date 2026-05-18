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
    allowNull: true, // null for anonymous votes
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
  timestamps: true,
  tableName: 'SuggestionVotes',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'targetType', 'targetId'],
      name: 'unique_user_suggestion_vote',
      where: {
        userId: {
          [sequelize.Sequelize.Op.ne]: null,
        },
      },
    },
    {
      // Device fingerprint: prevent same device from voting multiple times
      unique: true,
      fields: ['targetType', 'targetId', 'ipAddress', 'userAgent'],
      name: 'unique_device_vote_per_suggestion',
      where: {
        userId: null,
        isAuthenticated: false,
      },
    },
    { fields: ['targetType', 'targetId'] }
  ]
});

module.exports = SuggestionVote;
