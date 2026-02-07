const sequelize = require('../config/database');
const User = require('./User');
const Article = require('./Article');
const Location = require('./Location');
const LocationLink = require('./LocationLink');
const Poll = require('./Poll');
const PollOption = require('./PollOption');
const Vote = require('./Vote');

// Define associations
User.hasMany(Article, {
  foreignKey: 'authorId',
  as: 'articles'
});

Article.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

// Poll associations
User.hasMany(Poll, {
  foreignKey: 'creatorId',
  as: 'polls'
});

Poll.belongsTo(User, {
  foreignKey: 'creatorId',
  as: 'creator'
});

Poll.hasMany(PollOption, {
  foreignKey: 'pollId',
  as: 'options'
});

PollOption.belongsTo(Poll, {
  foreignKey: 'pollId',
  as: 'poll'
});

PollOption.belongsTo(User, {
  foreignKey: 'createdById',
  as: 'createdBy'
});

User.hasMany(PollOption, {
  foreignKey: 'createdById',
  as: 'pollOptions'
});

Poll.hasMany(Vote, {
  foreignKey: 'pollId',
  as: 'votes'
});

Vote.belongsTo(Poll, {
  foreignKey: 'pollId',
  as: 'poll'
});

Vote.belongsTo(PollOption, {
  foreignKey: 'optionId',
  as: 'option'
});

PollOption.hasMany(Vote, {
  foreignKey: 'optionId',
  as: 'votes'
});

Vote.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Vote, {
  foreignKey: 'userId',
  as: 'votes'
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
  LocationLink,
  Poll,
  PollOption,
  Vote
};
