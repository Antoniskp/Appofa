const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LocationElectionVote = sequelize.define('LocationElectionVote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Locations',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  roleKey: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Role being voted on: moderator, mayor, regional_governor, etc.'
  },
  voterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  candidateUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'LocationElectionVotes',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['locationId', 'roleKey', 'voterId'], name: 'uq_location_election_vote' },
    { fields: ['locationId', 'roleKey'] },
    { fields: ['candidateUserId'] }
  ]
});

module.exports = LocationElectionVote;
