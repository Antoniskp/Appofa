const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ManifestAcceptance = sequelize.define('ManifestAcceptance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  manifestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Manifests', key: 'id' },
    onDelete: 'CASCADE',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE',
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['manifestId', 'userId'] },
    { fields: ['manifestId'] },
    { fields: ['userId'] },
  ],
});

module.exports = ManifestAcceptance;
