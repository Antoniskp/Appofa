const sequelize = require('../config/database');
const User = require('./User');
const Article = require('./Article');
const Image = require('./Image');

// Define associations
User.hasMany(Article, {
  foreignKey: 'authorId',
  as: 'articles'
});

Article.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

// Image associations
User.hasMany(Image, {
  foreignKey: 'ownerId',
  as: 'images'
});

Image.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});

Article.belongsTo(Image, {
  foreignKey: 'introImageId',
  as: 'introImage'
});

Image.hasMany(Article, {
  foreignKey: 'introImageId',
  as: 'articles'
});

module.exports = {
  sequelize,
  User,
  Article,
  Image
};
