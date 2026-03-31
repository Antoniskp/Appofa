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
  positionTypeKey: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  scope: {
    type: DataTypes.ENUM('national', 'regional', 'municipal'),
    allowNull: false,
    defaultValue: 'national',
  },
  countryCode: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'GR',
  },
  jurisdictionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Locations', key: 'id' },
    onDelete: 'SET NULL',
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
