const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkerToken = sequelize.define('WorkerToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  token_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'WorkerTokens',
  timestamps: false,
  indexes: [
    { fields: ['name'] },
    { fields: ['created_by'] },
    { fields: ['revoked_at'] },
  ],
});

module.exports = WorkerToken;
