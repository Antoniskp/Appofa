const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('IssueFollow', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
  entityType: { type: DataTypes.STRING(20), allowNull: false },
  entityId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'IssueFollows', timestamps: true,
  indexes: [{ unique: true, fields: ['userId', 'entityType', 'entityId'] }],
});
