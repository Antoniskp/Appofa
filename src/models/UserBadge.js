const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserBadge = sequelize.define('UserBadge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE',
  },
  badgeSlug: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tier: {
    type: DataTypes.ENUM('bronze', 'silver', 'gold'),
    allowNull: false,
  },
  earnedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'badgeSlug', 'tier'] },
    { fields: ['userId'] },
  ],
});

module.exports = UserBadge;
