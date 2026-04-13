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
  /** FK → Users.id — set for endorsements on real user accounts. */
  endorsedId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  /** FK → PublicPersonProfiles.id — set for endorsements on unclaimed/pending person profiles. */
  endorsedPersonId: {
    type: DataTypes.INTEGER,
    allowNull: true
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
      fields: ['endorserId', 'endorsedId', 'endorsedPersonId', 'topic'],
      name: 'endorsements_unique_endorser_endorsed_person_topic'
    }
  ]
});

module.exports = Endorsement;
module.exports.ENDORSEMENT_TOPICS = ENDORSEMENT_TOPICS;
