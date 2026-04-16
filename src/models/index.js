const sequelize = require('../config/database');
const User = require('./User');
const GovernmentPosition = require('./GovernmentPosition');
const GovernmentCurrentHolder = require('./GovernmentCurrentHolder');
const GovernmentPositionSuggestion = require('./GovernmentPositionSuggestion');
const DreamTeamVote = require('./DreamTeamVote');
const Article = require('./Article');
const Location = require('./Location');
const LocationLink = require('./LocationLink');
const LocationRequest = require('./LocationRequest');
const LocationSection = require('./LocationSection');
const LocationRole = require('./LocationRole');
const LocationElectionVote = require('./LocationElectionVote');
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
const PersonRemovalRequest = require('./PersonRemovalRequest');
const Report = require('./Report');
const Formation = require('./Formation');
const FormationPick = require('./FormationPick');
const FormationLike = require('./FormationLike');
const UserBadge = require('./UserBadge');
const HeroSettings = require('./HeroSettings');
const Manifest = require('./Manifest');
const ManifestAcceptance = require('./ManifestAcceptance');
const Tag = require('./Tag');
const TaggableItem = require('./TaggableItem');
const Notification = require('./Notification');
const IpAccessRule = require('./IpAccessRule');

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

// LocationRole associations
LocationRole.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
Location.hasMany(LocationRole, { foreignKey: 'locationId', as: 'roles' });
LocationRole.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// LocationElectionVote associations
LocationElectionVote.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
LocationElectionVote.belongsTo(User, { foreignKey: 'voterId', as: 'voter' });
LocationElectionVote.belongsTo(User, { foreignKey: 'candidateUserId', as: 'candidate' });
User.hasMany(LocationElectionVote, { foreignKey: 'voterId', as: 'electionVotesCast' });
User.hasMany(LocationElectionVote, { foreignKey: 'candidateUserId', as: 'electionVotesReceived' });
Location.hasMany(LocationElectionVote, { foreignKey: 'locationId', as: 'electionVotes' });

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

// User self-referential claim associations
User.belongsTo(User, { foreignKey: 'claimedByUserId', as: 'claimedBy' });
User.belongsTo(User, { foreignKey: 'claimVerifiedByUserId', as: 'claimVerifiedBy' });
User.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdByModerator' });
User.hasMany(User, { foreignKey: 'claimedByUserId', as: 'claimedProfiles' });
User.belongsTo(Location, { foreignKey: 'constituencyId', as: 'constituency' });

// PersonRemovalRequest associations
PersonRemovalRequest.belongsTo(User, { foreignKey: 'userId', as: 'person' });
PersonRemovalRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
User.hasMany(PersonRemovalRequest, { foreignKey: 'reviewedBy', as: 'reviewedRemovalRequests' });

// Report associations
Report.belongsTo(User, { foreignKey: 'reportedByUserId', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
User.hasMany(Report, { foreignKey: 'reportedByUserId', as: 'reports' });
User.hasMany(Report, { foreignKey: 'reviewedBy', as: 'reviewedReports' });

// GovernmentPosition associations
GovernmentPosition.hasMany(GovernmentCurrentHolder, { foreignKey: 'positionId', as: 'currentHolders' });
GovernmentCurrentHolder.belongsTo(GovernmentPosition, { foreignKey: 'positionId', as: 'position' });
GovernmentCurrentHolder.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(GovernmentCurrentHolder, { foreignKey: 'userId', as: 'heldGovernmentPositions' });

GovernmentPosition.hasMany(GovernmentPositionSuggestion, { foreignKey: 'positionId', as: 'aiSuggestions' });
GovernmentPositionSuggestion.belongsTo(GovernmentPosition, { foreignKey: 'positionId', as: 'position' });
GovernmentPositionSuggestion.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(GovernmentPositionSuggestion, { foreignKey: 'userId', as: 'dreamTeamSuggestions' });

GovernmentPosition.belongsTo(Location, { foreignKey: 'jurisdictionId', as: 'jurisdiction' });

GovernmentPosition.hasMany(DreamTeamVote, { foreignKey: 'positionId', as: 'dreamTeamVotes' });
DreamTeamVote.belongsTo(GovernmentPosition, { foreignKey: 'positionId', as: 'position' });
DreamTeamVote.belongsTo(User, { foreignKey: 'userId', as: 'voter' });
DreamTeamVote.belongsTo(User, { foreignKey: 'candidateUserId', as: 'candidateUser' });
User.hasMany(DreamTeamVote, { foreignKey: 'userId', as: 'dreamTeamVotes' });

// Formation associations
User.hasMany(Formation, { foreignKey: 'userId', as: 'formations' });
Formation.belongsTo(User, { foreignKey: 'userId', as: 'author' });
Formation.hasMany(FormationPick, { foreignKey: 'formationId', as: 'picks' });
FormationPick.belongsTo(Formation, { foreignKey: 'formationId', as: 'formation' });
FormationPick.belongsTo(User, { foreignKey: 'candidateUserId', as: 'candidateUser' });
Formation.hasMany(FormationLike, { foreignKey: 'formationId', as: 'likes' });
FormationLike.belongsTo(Formation, { foreignKey: 'formationId', as: 'formation' });
FormationLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(FormationLike, { foreignKey: 'userId', as: 'formationLikes' });

// UserBadge associations
User.hasMany(UserBadge, { foreignKey: 'userId', as: 'badges' });
UserBadge.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Manifest associations
Manifest.hasMany(ManifestAcceptance, { foreignKey: 'manifestId', as: 'acceptances' });
ManifestAcceptance.belongsTo(Manifest, { foreignKey: 'manifestId', as: 'manifest' });
ManifestAcceptance.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ManifestAcceptance, { foreignKey: 'userId', as: 'manifestAcceptances' });

// Tag associations (polymorphic via TaggableItem)
TaggableItem.belongsTo(Tag, { foreignKey: 'tagId', as: 'tag', constraints: false });
Tag.hasMany(TaggableItem, { foreignKey: 'tagId', as: 'taggableItems', constraints: false });

Article.belongsToMany(Tag, {
  through: { model: TaggableItem, scope: { entityType: 'article' } },
  foreignKey: 'entityId',
  otherKey: 'tagId',
  as: 'tags',
  constraints: false
});
Tag.belongsToMany(Article, {
  through: { model: TaggableItem, scope: { entityType: 'article' } },
  foreignKey: 'tagId',
  otherKey: 'entityId',
  as: 'articles',
  constraints: false
});

Poll.belongsToMany(Tag, {
  through: { model: TaggableItem, scope: { entityType: 'poll' } },
  foreignKey: 'entityId',
  otherKey: 'tagId',
  as: 'tags',
  constraints: false
});
Tag.belongsToMany(Poll, {
  through: { model: TaggableItem, scope: { entityType: 'poll' } },
  foreignKey: 'tagId',
  otherKey: 'entityId',
  as: 'polls',
  constraints: false
});

Suggestion.belongsToMany(Tag, {
  through: { model: TaggableItem, scope: { entityType: 'suggestion' } },
  foreignKey: 'entityId',
  otherKey: 'tagId',
  as: 'tags',
  constraints: false
});
Tag.belongsToMany(Suggestion, {
  through: { model: TaggableItem, scope: { entityType: 'suggestion' } },
  foreignKey: 'tagId',
  otherKey: 'entityId',
  as: 'suggestions',
  constraints: false
});

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

// IpAccessRule associations
IpAccessRule.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdBy' });

module.exports = {
  sequelize,
  User,
  Article,
  Location,
  LocationLink,
  LocationRequest,
  LocationSection,
  LocationRole,
  LocationElectionVote,
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
  PersonRemovalRequest,
  Report,
  GovernmentPosition,
  GovernmentCurrentHolder,
  GovernmentPositionSuggestion,
  DreamTeamVote,
  Formation,
  FormationPick,
  FormationLike,
  UserBadge,
  HeroSettings,
  Manifest,
  ManifestAcceptance,
  Tag,
  TaggableItem,
  Notification,
  IpAccessRule,
};
