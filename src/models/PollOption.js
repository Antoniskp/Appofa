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
    allowNull: true,
    validate: {
      requiredForSimple(value) {
        // Custom validator: text is required for simple polls
        // This will be validated at the application level
        if (!value && this.text === null) {
          // Allow validation - will be enforced in application logic
          return;
        }
      }
    }
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  linkUrl: {
    type: DataTypes.STRING,
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
