const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [5, 200]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 50000]
    }
  },
  summary: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  bannerImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '/images/branding/news default.png'
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft',
    allowNull: false
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('personal', 'articles', 'news'),
    defaultValue: 'personal',
    allowNull: false
  },
  isNews: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  newsApprovedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  newsApprovedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  timestamps: true
});

module.exports = Article;
