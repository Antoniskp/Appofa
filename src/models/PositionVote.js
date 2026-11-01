const { DataTypes: S } = require('sequelize');
const sequelize = require('../config/database');

const fk = (model, nullable = false) => ({
  type: S.INTEGER, allowNull: nullable, references: { model, key: 'id' },
  onDelete: nullable ? 'SET NULL' : 'RESTRICT', onUpdate: 'CASCADE',
});
const choice = (values, defaultValue) => ({
  type: S.STRING(24), allowNull: false, defaultValue, validate: { isIn: [values] },
});

module.exports = sequelize.define('PositionVote', {
  revisionId: fk('PositionRevisions'),
  userId: fk('Users'),
  value: { type: S.SMALLINT, allowNull: false, validate: { isIn: [[-1, 1]] } },
  identityVisibility: choice(['anonymous', 'public'], 'anonymous')
}, { tableName: 'PositionVotes', timestamps: true, indexes: [{"unique":true,"fields":["revisionId","userId"]}] });

