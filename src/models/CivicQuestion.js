const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CivicQuestion = sequelize.define('CivicQuestion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [5, 200],
    },
  },
  originalLink: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sourceType: {
    type: DataTypes.ENUM('parliament', 'european_commission', 'municipal_council', 'regional_council', 'other'),
    allowNull: false,
    defaultValue: 'other',
  },
  sourceName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  simplified: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pros: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cons: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  dateAsked: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('open', 'closed', 'archived'),
    allowNull: false,
    defaultValue: 'open',
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Locations',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private', 'locals_only'),
    allowNull: false,
    defaultValue: 'public',
  },
  voteRestriction: {
    type: DataTypes.ENUM('authenticated', 'locals_only'),
    allowNull: false,
    defaultValue: 'authenticated',
  },
  resultsVisibility: {
    type: DataTypes.ENUM('always', 'after_vote', 'after_deadline'),
    allowNull: false,
    defaultValue: 'always',
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  officialIdentifier: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  commentsEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  commentsLocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'CivicQuestions',
  timestamps: true,
  indexes: [
    { fields: ['creatorId'] },
    { fields: ['locationId'] },
    { fields: ['status'] },
    { fields: ['sourceType'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = CivicQuestion;
