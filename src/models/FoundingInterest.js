const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('FoundingInterest', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE',
  },
  wantsToSign: { type: DataTypes.BOOLEAN, allowNull: false },
  wantsToVolunteer: { type: DataTypes.BOOLEAN, allowNull: false },
  signingPreference: { type: DataTypes.STRING(12), allowNull: true },
  signingStatus: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'requested' },
}, { tableName: 'FoundingInterests', timestamps: true });
