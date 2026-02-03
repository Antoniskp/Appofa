const sequelize = require('../config/database');
const User = require('./User');
const Article = require('./Article');

// Define associations
User.hasMany(Article, {
  foreignKey: 'authorId',
  as: 'articles'
});

Article.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

module.exports = {
  sequelize,
  User,
  Article
};
