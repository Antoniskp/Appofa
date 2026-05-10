const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NewsletterSubscriber = sequelize.define('NewsletterSubscriber', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
    set(value) {
      this.setDataValue('email', typeof value === 'string' ? value.trim().toLowerCase() : value);
    },
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'subscribed', 'unsubscribed'),
    allowNull: false,
    defaultValue: 'subscribed',
  },
  source: {
    type: DataTypes.ENUM('website', 'admin_manual', 'import'),
    allowNull: false,
    defaultValue: 'website',
  },
  locale: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('tags');
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('tags', Array.isArray(value) && value.length > 0 ? JSON.stringify(value) : null);
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  subscribedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  unsubscribedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  unsubscribeTokenHash: {
    type: DataTypes.STRING(128),
    allowNull: true,
    unique: true,
  },
  createdByAdminId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'NewsletterSubscribers',
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['source'] },
    { fields: ['locale'] },
    { fields: ['subscribedAt'] },
  ],
});

module.exports = NewsletterSubscriber;
