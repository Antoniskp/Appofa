const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 200]
    }
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: true
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'File size in bytes'
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Free text tags for searching and categorizing images'
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  isExternal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'True if image is from external URL, false if uploaded'
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['ownerId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Image;
