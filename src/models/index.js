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

// Location self-referential association (hierarchical)
Location.hasMany(Location, {
  foreignKey: 'parent_id',
  as: 'children'
});

Location.belongsTo(Location, {
  foreignKey: 'parent_id',
  as: 'parent'
});

// User home location
User.belongsTo(Location, {
  foreignKey: 'home_location_id',
  as: 'homeLocation'
});

Location.hasMany(User, {
  foreignKey: 'home_location_id',
  as: 'residents'
});

// Location links association
LocationLink.belongsTo(Location, {
  foreignKey: 'location_id',
  as: 'location'
});

Location.hasMany(LocationLink, {
  foreignKey: 'location_id',
  as: 'links'
});

module.exports = {
  sequelize,
  User,
  Article,
  Location,
  LocationLink
};
