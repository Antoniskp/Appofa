const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// One-time sign-in codes sent by email. Only a keyed hash of the code is stored.
const EmailLoginCode = sequelize.define('EmailLoginCode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  codeHash: {
    type: DataTypes.STRING(128),
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  consumedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'EmailLoginCodes',
  indexes: [
    { fields: ['email', 'createdAt'], name: 'email_login_codes_email_created_at' }
  ]
});

module.exports = EmailLoginCode;
