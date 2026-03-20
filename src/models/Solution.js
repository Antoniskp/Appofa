const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Solution = sequelize.define('Solution', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  suggestionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Suggestions',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  timestamps: true,
  tableName: 'Solutions',
  indexes: [
    { fields: ['suggestionId'] },
    { fields: ['authorId'] }
  ]
});

module.exports = Solution;
