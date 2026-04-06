const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HeroSettings = sequelize.define('HeroSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  backgroundImageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  },
  backgroundColor: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#1a2a3a',
  },
  slides: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('slides');
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    },
    set(val) {
      this.setDataValue('slides', JSON.stringify(Array.isArray(val) ? val : []));
    },
  },
}, {
  timestamps: true,
  tableName: 'HeroSettings',
});

module.exports = HeroSettings;
