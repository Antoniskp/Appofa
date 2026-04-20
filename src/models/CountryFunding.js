const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CountryFunding = sequelize.define('CountryFunding', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Locations',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  goalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 500.00,
  },
  currentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  donorCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('locked', 'funding', 'unlocked'),
    allowNull: false,
    defaultValue: 'locked',
  },
  donationUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  unlockedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  unlockedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['locationId'],
      name: 'country_funding_location_unique',
    },
  ],
});

module.exports = CountryFunding;
