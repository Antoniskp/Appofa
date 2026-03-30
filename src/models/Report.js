'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  contentType: {
    type: DataTypes.ENUM('article', 'person', 'poll', 'comment', 'candidate', 'user'),
    allowNull: false
  },
  contentId: { type: DataTypes.INTEGER, allowNull: false },
  category: {
    type: DataTypes.ENUM('misinformation', 'harassment', 'spam', 'privacy_violation', 'impersonation', 'inappropriate_content', 'other'),
    allowNull: false
  },
  message: { type: DataTypes.TEXT, allowNull: true },
  reporterName: { type: DataTypes.STRING, allowNull: true },
  reporterEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true }
  },
  reportedByUserId: { type: DataTypes.INTEGER, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'dismissed', 'actioned'),
    defaultValue: 'pending'
  },
  adminNotes: { type: DataTypes.TEXT, allowNull: true },
  reviewedBy: { type: DataTypes.INTEGER, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true }
});

module.exports = Report;
