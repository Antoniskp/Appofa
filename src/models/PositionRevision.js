const { DataTypes: S } = require('sequelize');
const sequelize = require('../config/database');

const fk = (model, nullable = false) => ({
  type: S.INTEGER, allowNull: nullable, references: { model, key: 'id' },
  onDelete: nullable ? 'SET NULL' : 'RESTRICT', onUpdate: 'CASCADE',
});
const choice = (values, defaultValue) => ({
  type: S.STRING(24), allowNull: false, defaultValue, validate: { isIn: [values] },
});

module.exports = sequelize.define('PositionRevision', {
  positionId: fk('OrganizationPositions'),
  version: { type: S.INTEGER, allowNull: false, validate: { min: 1 } },
  title: { type: S.STRING(200), allowNull: false, validate: { len: [5, 200] } },
  body: { type: S.TEXT, allowNull: false, validate: { notEmpty: true } },
  attribution: choice(['sourced', 'official', 'community'], 'sourced'),
  status: choice(['draft', 'in_review', 'published', 'superseded', 'rejected'], 'draft'),
  createdByUserId: fk('Users', true),
  reviewedByUserId: fk('Users', true),
  reviewedAt: { type: S.DATE, allowNull: true },
  publishedAt: { type: S.DATE, allowNull: true },
  reviewNote: { type: S.TEXT, allowNull: true }
}, { tableName: 'PositionRevisions', timestamps: true, indexes: [
  { unique: true, fields: ['positionId', 'version'] },
  { fields: ['positionId', 'status'] },
  { unique: true, fields: ['positionId'], where: { status: 'published' }, name: 'position_one_published_revision' },
] });

