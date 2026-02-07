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
      len: [3, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('open', 'closed'),
    defaultValue: 'open',
    allowNull: false
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
  pollType: {
    type: DataTypes.ENUM('simple', 'complex'),
    defaultValue: 'simple',
    allowNull: false,
    comment: 'simple = text options, complex = articles/persons with images'
  },
  questionType: {
    type: DataTypes.ENUM('single-choice', 'ranked-choice', 'free-text'),
    defaultValue: 'single-choice',
    allowNull: false
  },
  allowUnauthenticatedVoting: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Whether non-logged users can vote'
  },
  allowUserAddOptions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Whether users can add their own answer options'
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Flexible configuration (e.g., max ranked choices, free-text char limit)'
  }
}, {
  timestamps: true
});

module.exports = Poll;
