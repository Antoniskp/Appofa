const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TopicFollow = sequelize.define('TopicFollow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  topicId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'TopicFollows',
  indexes: [
    { unique: true, fields: ['topicId', 'userId'], name: 'topic_follows_topic_user_unique' },
    { fields: ['userId'], name: 'topic_follows_user_idx' },
    { fields: ['topicId'], name: 'topic_follows_topic_idx' }
  ]
});

module.exports = TopicFollow;
