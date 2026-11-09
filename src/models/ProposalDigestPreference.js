'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('ProposalDigestPreference', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
  enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  locale: { type: DataTypes.STRING(5), allowNull: false, defaultValue: 'el' },
  enabledAt: { type: DataTypes.DATE, allowNull: true },
  lastSentAt: { type: DataTypes.DATE, allowNull: true },
  unsubscribeTokenHash: { type: DataTypes.STRING(64), allowNull: true, unique: true },
}, { tableName: 'ProposalDigestPreferences', timestamps: true });
