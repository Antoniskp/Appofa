const { DataTypes: S } = require('sequelize');
const sequelize = require('../config/database');

const fk = (model, nullable = false) => ({
  type: S.INTEGER, allowNull: nullable, references: { model, key: 'id' },
  onDelete: nullable ? 'SET NULL' : 'RESTRICT', onUpdate: 'CASCADE',
});
const choice = (values, defaultValue) => ({
  type: S.STRING(24), allowNull: false, defaultValue, validate: { isIn: [values] },
});

module.exports = sequelize.define('PositionSource', {
  revisionId: fk('PositionRevisions'),
  provider: { type: S.STRING(80), allowNull: false },
  sourceUrl: { type: S.STRING(2048), allowNull: false, validate: { isUrl: true } },
  originalSourceUrl: { type: S.STRING(2048), allowNull: true, validate: { isUrl: true } },
  externalId: { type: S.STRING(255), allowNull: true },
  originalTopic: { type: S.STRING(255), allowNull: true },
  sourcePublishedAt: { type: S.DATE, allowNull: true },
  retrievedAt: { type: S.DATE, allowNull: false },
  contentFingerprint: { type: S.STRING(64), allowNull: false },
  reviewStatus: choice(['pending', 'verified', 'rejected'], 'pending')
}, { tableName: 'PositionSources', timestamps: true, indexes: [{"unique":true,"fields":["revisionId","provider","contentFingerprint"]},{"fields":["provider","externalId"]}] });

