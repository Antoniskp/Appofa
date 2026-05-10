const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewsletterCampaign = sequelize.define('NewsletterCampaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  previewText: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  htmlContent: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  textContent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'sent', 'failed'),
    allowNull: false,
    defaultValue: 'draft',
  },
  audienceFilters: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('audienceFilters');
      if (!raw) return {};
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      } catch {
        return {};
      }
    },
    set(value) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        this.setDataValue('audienceFilters', null);
        return;
      }
      this.setDataValue('audienceFilters', JSON.stringify(value));
    },
  },
  createdByAdminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  totalRecipients: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  successCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  failureCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'NewsletterCampaigns',
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['createdByAdminId'] },
    { fields: ['sentAt'] },
    { fields: ['scheduledAt'] },
  ],
});

module.exports = NewsletterCampaign;
