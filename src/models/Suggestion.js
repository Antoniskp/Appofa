const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Suggestion = sequelize.define('Suggestion', {
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
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('idea', 'problem', 'problem_request', 'location_suggestion'),
    defaultValue: 'idea',
    allowNull: false
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
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('open', 'under_review', 'implemented', 'rejected'),
    defaultValue: 'open',
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  partyId: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'Suggestions',
  indexes: [
    { fields: ['authorId'] },
    { fields: ['locationId'] },
    { fields: ['status'] },
    { fields: ['type'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = Suggestion;
