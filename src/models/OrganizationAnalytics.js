const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrganizationAnalytics = sequelize.define('OrganizationAnalytics', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Organizations', key: 'id' },
    onDelete: 'CASCADE',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  memberCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  activeMemberCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  pollCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  suggestionCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  officialPostCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'OrganizationAnalytics',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['organizationId', 'date'],
      name: 'organization_analytics_organization_id_date_unique',
    },
  ],
});

module.exports = OrganizationAnalytics;
