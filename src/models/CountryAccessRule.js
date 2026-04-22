const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CountryAccessRule = sequelize.define('CountryAccessRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  countryCode: {
    type: DataTypes.STRING(2),
    allowNull: false,
    unique: true,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

module.exports = CountryAccessRule;
