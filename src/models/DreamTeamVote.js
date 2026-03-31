const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DreamTeamVote = sequelize.define('DreamTeamVote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE',
  },
  positionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'GovernmentPositions', key: 'id' },
    onDelete: 'CASCADE',
  },
  personId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'PublicPersonProfiles', key: 'id' },
    onDelete: 'CASCADE',
  },
  personName: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
}, {
  tableName: 'DreamTeamVotes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'positionId'],
      name: 'unique_user_vote_per_position',
    },
  ],
});

module.exports = DreamTeamVote;
