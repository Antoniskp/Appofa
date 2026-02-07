const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Poll = sequelize.define('Poll', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [5, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('simple', 'complex'),
    defaultValue: 'simple',
    allowNull: false
  },
  allowUserContributions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  allowUnauthenticatedVotes: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private', 'locals_only'),
    defaultValue: 'public',
    allowNull: false
  },
  resultsVisibility: {
    type: DataTypes.ENUM('always', 'after_vote', 'after_deadline'),
    defaultValue: 'always',
    allowNull: false
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Locations',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('active', 'closed', 'archived'),
    defaultValue: 'active',
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'Polls'
});

module.exports = Poll;
