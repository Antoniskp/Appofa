const { DataTypes: S } = require('sequelize');
const sequelize = require('../config/database');


module.exports = sequelize.define('PolicyCategory', {
  name: { type: S.STRING(120), allowNull: false },
  slug: { type: S.STRING(140), allowNull: false },
  description: { type: S.TEXT, allowNull: true }
}, { tableName: 'PolicyCategories', timestamps: true, indexes: [{"unique":true,"fields":["slug"]}] });

