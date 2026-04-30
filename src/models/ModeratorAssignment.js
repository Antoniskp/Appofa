const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModeratorAssignment = sequelize.define('ModeratorAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  assignedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  }
}, {
  timestamps: true
});

module.exports = ModeratorAssignment;
