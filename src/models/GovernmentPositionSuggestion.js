const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GovernmentPositionSuggestion = sequelize.define('GovernmentPositionSuggestion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  positionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'GovernmentPositions', key: 'id' },
    onDelete: 'CASCADE',
  },
  personId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'PublicPersonProfiles', key: 'id' },
    onDelete: 'CASCADE',
  },
  reason: { type: DataTypes.TEXT, allowNull: true },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'GovernmentPositionSuggestions', timestamps: true });

module.exports = GovernmentPositionSuggestion;
