const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GeoAccessSetting = sequelize.define('GeoAccessSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: false,
  updatedAt: 'updatedAt',
  tableName: 'GeoAccessSettings',
});

module.exports = GeoAccessSetting;
