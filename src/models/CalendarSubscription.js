const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('CalendarSubscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
  category: { type: DataTypes.STRING(20), allowNull: true },
  locationId: { type: DataTypes.INTEGER, allowNull: true },
}, {
  timestamps: false,
  tableName: 'CalendarSubscriptions',
  indexes: [
    { unique: true, fields: ['userId', 'category'] },
    { unique: true, fields: ['userId', 'locationId'] },
  ],
});
