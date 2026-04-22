const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GeoVisit = sequelize.define('GeoVisit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  countryCode: {
    type: DataTypes.STRING(5),
    allowNull: true,
  },
  countryName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  isAuthenticated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isDiaspora: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  sessionHash: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  locale: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['countryCode'],
      name: 'geo_visit_country_code_index',
    },
    {
      fields: ['createdAt'],
      name: 'geo_visit_created_at_index',
    },
  ],
});

module.exports = GeoVisit;
