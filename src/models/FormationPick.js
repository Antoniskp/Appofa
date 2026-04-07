const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FormationPick = sequelize.define('FormationPick', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  formationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Formations', key: 'id' },
    onDelete: 'CASCADE',
  },
  positionSlug: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  candidateUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Users', key: 'id' },
    onDelete: 'SET NULL',
  },
  personName: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  photo: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'FormationPicks',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['formationId', 'positionSlug'],
      name: 'unique_pick_per_position',
    },
  ],
});

module.exports = FormationPick;
