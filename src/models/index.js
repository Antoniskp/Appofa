const sequelize = require('../config/database');
const User = require('./User');
const Article = require('./Article');
const Location = require('./Location');
const LocationLink = require('./LocationLink');
const LocationRequest = require('./LocationRequest');
const LocationSection = require('./LocationSection');
const Poll = require('./Poll');
const PollOption = require('./PollOption');
const PollVote = require('./PollVote');
const Bookmark = require('./Bookmark');
const Message = require('./Message');
const Follow = require('./Follow');
const Comment = require('./Comment');
const Endorsement = require('./Endorsement');
const Suggestion = require('./Suggestion');
const Solution = require('./Solution');
const SuggestionVote = require('./SuggestionVote');
const LinkPreviewCache = require('./LinkPreviewCache');
const CandidateProfile = require('./CandidateProfile');
const CandidateApplication = require('./CandidateApplication');
const PublicPersonProfile = require('./PublicPersonProfile');

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

User.hasMany(Bookmark, {
  foreignKey: 'userId',
  as: 'bookmarks'
});

Bookmark.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Message associations
Message.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Message.belongsTo(User, {
  foreignKey: 'respondedBy',
  as: 'responder'
});

Message.belongsTo(Location, {
  foreignKey: 'locationId',
  as: 'location'
});

User.hasMany(Message, {
  foreignKey: 'userId',
  as: 'messages'
});

User.hasMany(Message, {
  foreignKey: 'respondedBy',
  as: 'respondedMessages'
});

// Follow associations
User.belongsToMany(User, {
  through: Follow,
  foreignKey: 'followerId',
  otherKey: 'followingId',
  as: 'following'
});

User.belongsToMany(User, {
  through: Follow,
  foreignKey: 'followingId',
  otherKey: 'followerId',
  as: 'followers'
});

Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'followingId', as: 'followingUser' });

// Comment associations
Comment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
Comment.belongsTo(User, { as: 'moderator', foreignKey: 'moderatedByUserId' });
Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId' });
Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId' });
User.hasMany(Comment, { foreignKey: 'authorId', as: 'comments' });

// LocationRequest associations
LocationRequest.belongsTo(User, { foreignKey: 'requestedByUserId', as: 'requestedBy' });
LocationRequest.belongsTo(User, { foreignKey: 'reviewedByUserId', as: 'reviewedBy' });
User.hasMany(LocationRequest, { foreignKey: 'requestedByUserId', as: 'locationRequests' });

// LocationSection associations
Location.hasMany(LocationSection, { foreignKey: 'locationId', as: 'sections' });
LocationSection.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
LocationSection.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdBy' });
LocationSection.belongsTo(User, { foreignKey: 'updatedByUserId', as: 'updatedBy' });

// Endorsement associations
Endorsement.belongsTo(User, { foreignKey: 'endorserId', as: 'endorser' });
Endorsement.belongsTo(User, { foreignKey: 'endorsedId', as: 'endorsed' });
User.hasMany(Endorsement, { foreignKey: 'endorserId', as: 'givenEndorsements' });
User.hasMany(Endorsement, { foreignKey: 'endorsedId', as: 'receivedEndorsements' });

// Suggestion associations
Suggestion.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
Suggestion.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
Suggestion.hasMany(Solution, { foreignKey: 'suggestionId', as: 'solutions' });
User.hasMany(Suggestion, { foreignKey: 'authorId', as: 'suggestions' });

// Solution associations
Solution.belongsTo(Suggestion, { foreignKey: 'suggestionId', as: 'suggestion' });
Solution.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(Solution, { foreignKey: 'authorId', as: 'solutions' });

// SuggestionVote associations
SuggestionVote.belongsTo(User, { foreignKey: 'userId', as: 'voter' });
User.hasMany(SuggestionVote, { foreignKey: 'userId', as: 'suggestionVotes' });

// CandidateProfile associations (legacy)
CandidateProfile.belongsTo(Location, { foreignKey: 'constituencyId', as: 'constituency' });
CandidateProfile.belongsTo(User, { foreignKey: 'claimedByUserId', as: 'claimedBy' });
CandidateProfile.belongsTo(User, { foreignKey: 'claimVerifiedByUserId', as: 'claimVerifiedBy' });
CandidateProfile.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdBy' });
CandidateProfile.belongsTo(User, { foreignKey: 'appointedByUserId', as: 'appointedBy' });
CandidateProfile.hasMany(CandidateApplication, { foreignKey: 'candidateProfileId', as: 'applications' });
User.hasOne(CandidateProfile, { foreignKey: 'claimedByUserId', as: 'candidateProfile' });

// CandidateApplication associations
CandidateApplication.belongsTo(User, { foreignKey: 'applicantUserId', as: 'applicant' });
CandidateApplication.belongsTo(User, { foreignKey: 'reviewedByUserId', as: 'reviewer' });
CandidateApplication.belongsTo(Location, { foreignKey: 'constituencyId', as: 'constituency' });
CandidateApplication.belongsTo(CandidateProfile, { foreignKey: 'candidateProfileId', as: 'candidateProfile' });
CandidateApplication.belongsTo(PublicPersonProfile, { foreignKey: 'publicPersonProfileId', as: 'publicPersonProfile' });
User.hasMany(CandidateApplication, { foreignKey: 'applicantUserId', as: 'candidateApplications' });

// PublicPersonProfile associations
PublicPersonProfile.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
PublicPersonProfile.belongsTo(Location, { foreignKey: 'constituencyId', as: 'constituency' });
PublicPersonProfile.belongsTo(User, { foreignKey: 'claimedByUserId', as: 'claimedBy' });
PublicPersonProfile.belongsTo(User, { foreignKey: 'claimVerifiedByUserId', as: 'claimVerifiedBy' });
PublicPersonProfile.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdBy' });
PublicPersonProfile.belongsTo(User, { foreignKey: 'appointedByUserId', as: 'appointedBy' });
PublicPersonProfile.hasMany(CandidateApplication, { foreignKey: 'publicPersonProfileId', as: 'applications' });
User.hasOne(PublicPersonProfile, { foreignKey: 'claimedByUserId', as: 'publicPersonProfile' });

module.exports = {
  sequelize,
  User,
  Article,
  Location,
  LocationLink,
  LocationRequest,
  LocationSection,
  Poll,
  PollOption,
  PollVote,
  Bookmark,
  Message,
  Follow,
  Comment,
  Endorsement,
  Suggestion,
  Solution,
  SuggestionVote,
  LinkPreviewCache,
  CandidateProfile,
  CandidateApplication,
  PublicPersonProfile
};
