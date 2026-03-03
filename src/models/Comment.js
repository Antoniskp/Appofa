const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  entityType: { type: DataTypes.ENUM('article', 'poll', 'user_profile'), allowNull: false },
  entityId: { type: DataTypes.INTEGER, allowNull: false },
  authorId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
  parentId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Comments', key: 'id' } },
  body: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('visible', 'hidden', 'deleted'), defaultValue: 'visible', allowNull: false },
  moderatedByUserId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' } },
  moderatedAt: { type: DataTypes.DATE, allowNull: true },
  moderationReason: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: true, tableName: 'Comments' });

module.exports = Comment;
