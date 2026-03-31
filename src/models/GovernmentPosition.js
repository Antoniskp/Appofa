const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GovernmentPosition = sequelize.define('GovernmentPosition', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  titleEn: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  category: {
    type: DataTypes.ENUM('president', 'prime_minister', 'minister'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'GovernmentPositions',
  timestamps: true,
});

module.exports = GovernmentPosition;
