const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LocationRequest = sequelize.define('LocationRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  countryName: { type: DataTypes.STRING, allowNull: false },
  countryNameLocal: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  requestedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' }
  },
  reviewedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' }
  },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
  reviewNotes: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: true, tableName: 'LocationRequests' });

module.exports = LocationRequest;
