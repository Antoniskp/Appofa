const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Formation = sequelize.define('Formation', {
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
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'serious',
    validate: {
      isIn: [['serious', 'fun', 'custom']],
    },
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  shareSlug: {
    type: DataTypes.STRING(32),
    allowNull: true,
    unique: true,
  },
  likeCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'Formations',
  timestamps: true,
});

module.exports = Formation;
