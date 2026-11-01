const { DataTypes: S } = require('sequelize');
const sequelize = require('../config/database');

const fk = (model, nullable = false) => ({
  type: S.INTEGER, allowNull: nullable, references: { model, key: 'id' },
  onDelete: nullable ? 'SET NULL' : 'RESTRICT', onUpdate: 'CASCADE',
});
const choice = (values, defaultValue) => ({
  type: S.STRING(24), allowNull: false, defaultValue, validate: { isIn: [values] },
});

module.exports = sequelize.define('OrganizationPosition', {
  organizationId: fk('Organizations'),
  categoryId: fk('PolicyCategories'),
  locationId: fk('Locations', true),
  suggestionId: fk('Suggestions', true),
  createdByUserId: fk('Users', true),
  status: choice(['active', 'withdrawn', 'archived'], 'active')
}, { tableName: 'OrganizationPositions', timestamps: true, indexes: [{"fields":["organizationId","status"]},{"fields":["categoryId"]}] });

