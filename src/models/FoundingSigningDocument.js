'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('FoundingSigningDocument', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  version: { type: DataTypes.STRING(100), allowNull: false },
  pdfUrl: { type: DataTypes.STRING(500), allowNull: false },
  sha256: { type: DataTypes.STRING(64), allowNull: false },
  govGrEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
});
