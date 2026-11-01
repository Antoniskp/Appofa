const { DataTypes: S } = require('sequelize');
const sequelize = require('../config/database');

const fk = (model, nullable = false) => ({
  type: S.INTEGER, allowNull: nullable, references: { model, key: 'id' },
  onDelete: nullable ? 'SET NULL' : 'RESTRICT', onUpdate: 'CASCADE',
});

module.exports = sequelize.define('PositionTopic', {
  positionId: fk('OrganizationPositions'),
  topicId: fk('Topics')
}, { tableName: 'PositionTopics', timestamps: true, indexes: [{"unique":true,"fields":["positionId","topicId"]},{"fields":["topicId"]}] });

