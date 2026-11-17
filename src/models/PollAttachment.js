const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('PollAttachment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  pollId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Polls', key: 'id' }, onDelete: 'CASCADE' },
  uploadedByUserId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
  storageKey: { type: DataTypes.STRING(100), allowNull: false },
  thumbnailKey: { type: DataTypes.STRING(100), allowNull: true },
  originalName: { type: DataTypes.STRING(255), allowNull: false },
  mimeType: { type: DataTypes.STRING(100), allowNull: false },
  size: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  caption: { type: DataTypes.STRING(500), allowNull: true },
  order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { tableName: 'PollAttachments', timestamps: true, indexes: [{ fields: ['pollId'] }, { fields: ['uploadedByUserId', 'createdAt'] }] });
