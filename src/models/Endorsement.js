const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ENDORSEMENT_TOPICS = [
  'Education',
  'Economy',
  'Health',
  'Environment',
  'Local Governance',
  'Technology'
];

const Endorsement = sequelize.define('Endorsement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  endorserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  endorsedId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  topic: {
    type: DataTypes.ENUM(...ENDORSEMENT_TOPICS),
    allowNull: false,
    validate: {
      isIn: [ENDORSEMENT_TOPICS]
    }
  }
}, {
  timestamps: true,
  tableName: 'Endorsements',
  indexes: [
    {
      unique: true,
      fields: ['endorserId', 'endorsedId', 'topic'],
      name: 'endorsements_unique_endorser_endorsed_topic'
    }
  ]
});

module.exports = Endorsement;
module.exports.ENDORSEMENT_TOPICS = ENDORSEMENT_TOPICS;
