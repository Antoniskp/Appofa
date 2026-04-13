'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PersonRemovalRequest = sequelize.define('PersonRemovalRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  requesterName: { type: DataTypes.STRING, allowNull: false },
  requesterEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true }
  },
  message: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  adminNotes: { type: DataTypes.TEXT, allowNull: true },
  reviewedBy: { type: DataTypes.INTEGER, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true }
});

module.exports = PersonRemovalRequest;
