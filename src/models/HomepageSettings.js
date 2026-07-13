const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DEFAULT_MANIFEST_SECTION = { enabled: true, audience: 'all' };
const DEFAULT_FEATURED_POLL = { enabled: false, audience: 'all', pollId: null };

const HomepageSettings = sequelize.define('HomepageSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  manifestSection: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify(DEFAULT_MANIFEST_SECTION),
    get() {
      const raw = this.getDataValue('manifestSection');
      try {
        return JSON.parse(raw);
      } catch {
        return DEFAULT_MANIFEST_SECTION;
      }
    },
    set(val) {
      this.setDataValue('manifestSection', JSON.stringify(val));
    },
  },
  featuredPoll: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify(DEFAULT_FEATURED_POLL),
    get() {
      const raw = this.getDataValue('featuredPoll');
      try {
        return { ...DEFAULT_FEATURED_POLL, ...JSON.parse(raw) };
      } catch {
        return DEFAULT_FEATURED_POLL;
      }
    },
    set(val) {
      this.setDataValue('featuredPoll', JSON.stringify(val));
    },
  },
}, {
  timestamps: true,
  tableName: 'HomepageSettings',
});

module.exports = HomepageSettings;
