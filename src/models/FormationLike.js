const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FormationLike = sequelize.define('FormationLike', {
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'FormationLikes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['formationId', 'userId'],
      name: 'unique_formation_like',
    },
  ],
});

module.exports = FormationLike;
