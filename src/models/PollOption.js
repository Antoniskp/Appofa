const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PollOption = sequelize.define('PollOption', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pollId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Polls',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  optionText: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    }
  },
  optionType: {
    type: DataTypes.ENUM('text', 'article', 'person'),
    defaultValue: 'text',
    allowNull: false,
    comment: 'Type of option for complex polls'
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Optional image URL for complex options'
  },
  linkUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Optional link to article, profile, etc.'
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'For person-based or article title'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional flexible data'
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'User who added this option (if user-added)'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Display order'
  }
}, {
  timestamps: true
});

module.exports = PollOption;
