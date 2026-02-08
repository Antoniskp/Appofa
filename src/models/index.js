const sequelize = require('../config/database');
const User = require('./User');
const Article = require('./Article');
const Location = require('./Location');
const LocationLink = require('./LocationLink');
const Poll = require('./Poll');
const PollOption = require('./PollOption');
const PollVote = require('./PollVote');
const ActiveSession = require('./ActiveSession');

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

// Poll associations
Poll.belongsTo(User, {
  foreignKey: 'creatorId',
  as: 'creator'
});

Poll.belongsTo(Location, {
  foreignKey: 'locationId',
  as: 'location'
});

Poll.hasMany(PollOption, {
  foreignKey: 'pollId',
  as: 'options'
});

Poll.hasMany(PollVote, {
  foreignKey: 'pollId',
  as: 'votes'
});

// PollOption associations
PollOption.belongsTo(Poll, {
  foreignKey: 'pollId',
  as: 'poll'
});

PollOption.belongsTo(User, {
  foreignKey: 'addedByUserId',
  as: 'addedBy'
});

PollOption.hasMany(PollVote, {
  foreignKey: 'optionId',
  as: 'votes'
});

// PollVote associations
PollVote.belongsTo(Poll, {
  foreignKey: 'pollId',
  as: 'poll'
});

PollVote.belongsTo(PollOption, {
  foreignKey: 'optionId',
  as: 'option'
});

PollVote.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User poll associations
User.hasMany(Poll, {
  foreignKey: 'creatorId',
  as: 'polls'
});

User.hasMany(PollVote, {
  foreignKey: 'userId',
  as: 'pollVotes'
});

// ActiveSession associations
User.hasMany(ActiveSession, {
  foreignKey: 'userId',
  as: 'activeSessions'
});

ActiveSession.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  sequelize,
  User,
  Article,
  Location,
  LocationLink,
  Poll,
  PollOption,
  PollVote,
  ActiveSession
};
