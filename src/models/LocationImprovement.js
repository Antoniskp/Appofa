const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('LocationImprovement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  locationId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Locations', key: 'id' }, onDelete: 'CASCADE' },
  authorId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
  reviewerId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
  kind: { type: DataTypes.STRING(20), allowNull: false },
  field: { type: DataTypes.STRING(40), allowNull: false },
  originalValue: { type: DataTypes.TEXT, allowNull: false },
  proposedValue: { type: DataTypes.TEXT, allowNull: false },
  sourceUrl: { type: DataTypes.STRING(2048), allowNull: true },
  note: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'pending' },
  reviewNote: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
}, { indexes: [{ fields: ['locationId', 'status', 'createdAt'] }, { fields: ['authorId'] }] });
