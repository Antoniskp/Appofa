const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define('ConsultationEvaluation', {
  civicQuestionId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'CivicQuestions', key: 'id' },
    onDelete: 'CASCADE',
  },
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE',
  },
  choice: { type: DataTypes.STRING(20), allowNull: false },
}, { tableName: 'ConsultationEvaluations', timestamps: true });
