'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LegalLibraryTarget = sequelize.define('LegalLibraryTarget', {
  documentId: { type: DataTypes.STRING, allowNull: false },
  unitId: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  label: { type: DataTypes.TEXT, allowNull: false },
}, { timestamps: false, indexes: [{ unique: true, fields: ['documentId', 'unitId'] }] });

const LegalLibraryVote = sequelize.define('LegalLibraryVote', {
  targetId: {
    type: DataTypes.INTEGER, primaryKey: true, references: { model: LegalLibraryTarget, key: 'id' }, onDelete: 'CASCADE',
  },
  userId: {
    type: DataTypes.INTEGER, primaryKey: true, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE',
  },
  choice: { type: DataTypes.STRING(8), allowNull: false, validate: { isIn: [['support', 'oppose']] } },
});

module.exports = { LegalLibraryTarget, LegalLibraryVote };
