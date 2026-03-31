const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GovernmentCurrentHolder = sequelize.define('GovernmentCurrentHolder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  positionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'GovernmentPositions', key: 'id' },
    onDelete: 'CASCADE',
  },
  personId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'PublicPersonProfiles', key: 'id' },
    onDelete: 'SET NULL',
  },
  holderName: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  holderPhoto: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  since: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'GovernmentCurrentHolders',
  timestamps: true,
});

module.exports = GovernmentCurrentHolder;
