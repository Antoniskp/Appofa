'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('FoundingSignature', {
  userId: {
    type: DataTypes.INTEGER, unique: true, allowNull: true,
    references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL',
  },
  legalName: { type: DataTypes.STRING(160), allowNull: false },
  recordReference: { type: DataTypes.STRING(80), unique: true, allowNull: false },
  govDocumentFingerprint: { type: DataTypes.STRING(64), allowNull: true, unique: true },
  verifiedByUserId: {
    type: DataTypes.INTEGER, allowNull: true,
    references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL',
  },
  publicName: { type: DataTypes.STRING(100), allowNull: true },
}, { tableName: 'FoundingSignatures' });
