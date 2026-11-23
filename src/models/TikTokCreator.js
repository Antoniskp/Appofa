const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('TikTokCreator', {
  handle: { type: DataTypes.STRING(24), allowNull: false, unique: true },
  displayName: { type: DataTypes.STRING(100), allowNull: true },
  category: { type: DataTypes.STRING(24), allowNull: true },
  locationId: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'pending' },
  reviewedByUserId: { type: DataTypes.INTEGER, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'TikTokCreators',
  indexes: [
    { fields: ['status', 'locationId', 'category'], name: 'tiktok_creators_directory_idx' },
  ],
});
