const sequelize = require('../config/database');
const User = require('./User');
const Article = require('./Article');
const Location = require('./Location');
const LocationLink = require('./LocationLink');

// Define associations
User.hasMany(Article, {
  foreignKey: 'authorId',
  as: 'articles'
});

Article.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

// Location self-referencing for hierarchy
Location.hasMany(Location, {
  foreignKey: 'parent_id',
  as: 'children'
});

Location.belongsTo(Location, {
  foreignKey: 'parent_id',
  as: 'parent'
});

// Location to LocationLink associations
Location.hasMany(LocationLink, {
  foreignKey: 'location_id',
  as: 'links'
});

LocationLink.belongsTo(Location, {
  foreignKey: 'location_id',
  as: 'location'
});

// User home location
User.belongsTo(Location, {
  foreignKey: 'homeLocationId',
  as: 'homeLocation'
});

module.exports = {
  sequelize,
  User,
  Article,
  Location,
  LocationLink
};
