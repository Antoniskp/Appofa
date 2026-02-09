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
  text: {
    type: DataTypes.STRING,
    allowNull: true
    // Note: text is required for simple polls but validation is enforced at the application level
    // since we need to check the parent poll's type which isn't accessible in model validation
  },
  photoUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  linkUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  displayText: {
    type: DataTypes.STRING,
    allowNull: true
  },
  answerType: {
    type: DataTypes.ENUM('person', 'article', 'custom'),
    allowNull: true
  },
  addedByUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'PollOptions',
  indexes: [
    {
      fields: ['pollId']
    }
  ]
});

module.exports = PollOption;
