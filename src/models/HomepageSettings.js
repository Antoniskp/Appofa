const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DEFAULT_MANIFEST_SECTION = { enabled: true, audience: 'all' };
const DEFAULT_INFO_SECTION = {
  enabled: false,
  audience: 'guest',
  bannerText: 'Ψήφισε ελεύθερα · Ανώνυμα',
  subText: 'Πριν γράψεις, καλό θα είναι να γνωρίζεις αυτά',
  experimentalNotice: true,
  quickLinks: [],
  roadmap: [],
  done: [],
};

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
  infoSection: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify(DEFAULT_INFO_SECTION),
    get() {
      const raw = this.getDataValue('infoSection');
      try {
        return JSON.parse(raw);
      } catch {
        return DEFAULT_INFO_SECTION;
      }
    },
    set(val) {
      this.setDataValue('infoSection', JSON.stringify(val));
    },
  },
}, {
  timestamps: true,
  tableName: 'HomepageSettings',
});

module.exports = HomepageSettings;
