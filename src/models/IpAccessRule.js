const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IpAccessRule = sequelize.define('IpAccessRule', {
  ip: {
    type: DataTypes.STRING(45),
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.ENUM('whitelist', 'blacklist'),
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = IpAccessRule;
