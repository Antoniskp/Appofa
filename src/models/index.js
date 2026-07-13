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
const UserLocationRole = require('./UserLocationRole');
const LocationElectionVote = require('./LocationElectionVote');
const Poll = require('./Poll');
const PollOption = require('./PollOption');
const PollVote = require('./PollVote');
const CivicQuestion = require('./CivicQuestion');
const CivicQuestionVote = require('./CivicQuestionVote');
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
const HomepageSettings = require('./HomepageSettings');
const Manifest = require('./Manifest');
const ManifestAcceptance = require('./ManifestAcceptance');
const Tag = require('./Tag');
const TaggableItem = require('./TaggableItem');
const Topic = require('./Topic');
const TopicExternalLink = require('./TopicExternalLink');
const TopicFollow = require('./TopicFollow');
const Notification = require('./Notification');
const IpAccessRule = require('./IpAccessRule');
const GeoVisit = require('./GeoVisit');
const CountryFunding = require('./CountryFunding');
const CountryAccessRule = require('./CountryAccessRule');
const GeoAccessSetting = require('./GeoAccessSetting');
const Organization = require('./Organization');
const OrganizationMember = require('./OrganizationMember');
const OrganizationRole = require('./OrganizationRole');
const OrganizationClaimRequest = require('./OrganizationClaimRequest');
const OrganizationAnalytics = require('./OrganizationAnalytics');
const UserPoliticalAffiliation = require('./UserPoliticalAffiliation');
const NewsletterSubscriber = require('./NewsletterSubscriber');
const NewsletterCampaign = require('./NewsletterCampaign');
const NewsletterSendLog = require('./NewsletterSendLog');
const PushSubscription = require('./PushSubscription');
const WorkerToken = require('./WorkerToken');
const MunicipalityDistrictMap = require('./MunicipalityDistrictMap');
const CandidateRegistration = require('./CandidateRegistration');
const OnboardingEvent = require('./OnboardingEvent');
const MediaAsset = require('./MediaAsset');

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
Poll.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
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

// Civic Question associations
CivicQuestion.belongsTo(User, {
  foreignKey: 'creatorId',
  as: 'creator'
});

CivicQuestion.belongsTo(Location, {
  foreignKey: 'locationId',
  as: 'location'
});

CivicQuestion.hasMany(CivicQuestionVote, {
  foreignKey: 'civicQuestionId',
  as: 'votes'
});

CivicQuestionVote.belongsTo(CivicQuestion, {
  foreignKey: 'civicQuestionId',
  as: 'civicQuestion'
});

CivicQuestionVote.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(CivicQuestion, {
  foreignKey: 'creatorId',
  as: 'civicQuestions'
});

User.hasMany(CivicQuestionVote, {
  foreignKey: 'userId',
  as: 'civicQuestionVotes'
});

Location.hasMany(CivicQuestion, {
  foreignKey: 'locationId',
  as: 'civicQuestions'
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
User.hasMany(LocationRole, { foreignKey: 'userId', as: 'locationRoles' });

// UserLocationRole associations (platform moderator/role assignments via join table)
UserLocationRole.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserLocationRole.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
User.hasMany(UserLocationRole, { foreignKey: 'userId', as: 'locationRoleAssignments' });
Location.hasMany(UserLocationRole, { foreignKey: 'locationId', as: 'userRoleAssignments' });

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
Suggestion.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
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

// Topic curation associations
Topic.belongsTo(Tag, { foreignKey: 'tagId', as: 'tag' });
Tag.hasOne(Topic, { foreignKey: 'tagId', as: 'topic' });
Topic.hasMany(TopicExternalLink, { foreignKey: 'topicId', as: 'externalLinks' });
TopicExternalLink.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });
Topic.hasMany(TopicFollow, { foreignKey: 'topicId', as: 'followers' });
TopicFollow.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });
TopicFollow.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(TopicFollow, { foreignKey: 'userId', as: 'topicFollows' });
Topic.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdBy' });
Topic.belongsTo(User, { foreignKey: 'updatedByUserId', as: 'updatedBy' });
TopicExternalLink.belongsTo(User, { foreignKey: 'submittedByUserId', as: 'submittedBy' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

// IpAccessRule associations
IpAccessRule.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdBy' });
CountryAccessRule.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdBy' });
GeoVisit.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(GeoVisit, { foreignKey: 'userId', as: 'geoVisits' });

// CountryFunding associations
CountryFunding.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
Location.hasOne(CountryFunding, { foreignKey: 'locationId', as: 'funding' });
CountryFunding.belongsTo(User, { foreignKey: 'unlockedByUserId', as: 'unlockedBy' });

// Organization associations
Organization.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdBy' });
User.hasMany(Organization, { foreignKey: 'createdByUserId', as: 'createdOrganizations' });
Organization.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
Location.hasMany(Organization, { foreignKey: 'locationId', as: 'organizations' });

Organization.hasMany(OrganizationMember, { foreignKey: 'organizationId', as: 'members' });
Organization.hasMany(OrganizationRole, { foreignKey: 'organizationId', as: 'orgRoles' });
Organization.hasMany(OrganizationClaimRequest, { foreignKey: 'organizationId', as: 'claimRequests' });
Organization.hasMany(Poll, { foreignKey: 'organizationId', as: 'polls' });
Organization.hasMany(Suggestion, { foreignKey: 'organizationId', as: 'suggestions' });
Organization.belongsTo(Organization, { foreignKey: 'parentId', as: 'parent' });
Organization.hasMany(Organization, { foreignKey: 'parentId', as: 'children' });
Organization.hasMany(OrganizationAnalytics, { foreignKey: 'organizationId', as: 'analytics' });
OrganizationMember.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
OrganizationMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(OrganizationMember, { foreignKey: 'userId', as: 'organizationMemberships' });
OrganizationMember.belongsTo(User, { foreignKey: 'invitedByUserId', as: 'invitedBy' });
User.hasMany(OrganizationMember, { foreignKey: 'invitedByUserId', as: 'organizationInvitationsSent' });
OrganizationAnalytics.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

// OrganizationRole associations
OrganizationRole.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
OrganizationRole.belongsTo(User, { foreignKey: 'userId', as: 'user' });
OrganizationRole.belongsTo(User, { foreignKey: 'personId', as: 'personProfile' });

// Organization claim request associations
OrganizationClaimRequest.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
OrganizationClaimRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
OrganizationClaimRequest.belongsTo(User, { foreignKey: 'reviewedByUserId', as: 'reviewedBy' });
User.hasMany(OrganizationClaimRequest, { foreignKey: 'userId', as: 'organizationClaimRequests' });
User.hasMany(OrganizationClaimRequest, { foreignKey: 'reviewedByUserId', as: 'reviewedOrganizationClaims' });

// UserPoliticalAffiliation associations
User.hasMany(UserPoliticalAffiliation, { foreignKey: 'userId', as: 'politicalAffiliations' });
UserPoliticalAffiliation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserPoliticalAffiliation.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
Organization.hasMany(UserPoliticalAffiliation, { foreignKey: 'organizationId', as: 'politicalAffiliations' });

// PushSubscription associations
PushSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(PushSubscription, { foreignKey: 'userId', as: 'pushSubscriptions' });

// Newsletter associations
NewsletterSubscriber.belongsTo(User, { foreignKey: 'createdByAdminId', as: 'createdByAdmin' });
User.hasMany(NewsletterSubscriber, { foreignKey: 'createdByAdminId', as: 'newsletterSubscribersCreated' });
NewsletterCampaign.belongsTo(User, { foreignKey: 'createdByAdminId', as: 'createdByAdmin' });
User.hasMany(NewsletterCampaign, { foreignKey: 'createdByAdminId', as: 'newsletterCampaignsCreated' });
NewsletterSendLog.belongsTo(NewsletterCampaign, { foreignKey: 'campaignId', as: 'campaign' });
NewsletterCampaign.hasMany(NewsletterSendLog, { foreignKey: 'campaignId', as: 'sendLogs' });
NewsletterSendLog.belongsTo(NewsletterSubscriber, { foreignKey: 'subscriberId', as: 'subscriber' });
NewsletterSubscriber.hasMany(NewsletterSendLog, { foreignKey: 'subscriberId', as: 'sendLogs' });

// Worker token associations
WorkerToken.belongsTo(User, { foreignKey: 'created_by', as: 'createdByAdmin' });
User.hasMany(WorkerToken, { foreignKey: 'created_by', as: 'workerTokensCreated' });

// MunicipalityDistrictMap associations (many-to-many: municipalities ↔ electoral districts)
MunicipalityDistrictMap.belongsTo(Location, { foreignKey: 'municipalityId', as: 'municipality' });
MunicipalityDistrictMap.belongsTo(Location, { foreignKey: 'electoralDistrictId', as: 'electoralDistrict' });

Location.belongsToMany(Location, {
  through: MunicipalityDistrictMap,
  foreignKey: 'municipalityId',
  otherKey: 'electoralDistrictId',
  as: 'electoralDistricts'
});

Location.belongsToMany(Location, {
  through: MunicipalityDistrictMap,
  foreignKey: 'electoralDistrictId',
  otherKey: 'municipalityId',
  as: 'districtMunicipalities'
});

Location.hasMany(MunicipalityDistrictMap, { foreignKey: 'municipalityId', as: 'districtMappings' });
Location.hasMany(MunicipalityDistrictMap, { foreignKey: 'electoralDistrictId', as: 'municipalityMappings' });


// MediaAsset associations
MediaAsset.belongsTo(User, { foreignKey: 'uploadedByUserId', as: 'uploadedBy' });
User.hasMany(MediaAsset, { foreignKey: 'uploadedByUserId', as: 'uploadedMediaAssets' });
Article.belongsTo(MediaAsset, { foreignKey: 'coverImageId', as: 'coverImage' });
MediaAsset.hasMany(Article, { foreignKey: 'coverImageId', as: 'coverArticles' });
PollOption.belongsTo(MediaAsset, { foreignKey: 'mediaAssetId', as: 'mediaAsset' });
MediaAsset.hasMany(PollOption, { foreignKey: 'mediaAssetId', as: 'pollOptions' });

// Candidate registration associations
CandidateRegistration.belongsTo(User, { foreignKey: 'userId', as: 'candidate' });
CandidateRegistration.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
CandidateRegistration.belongsTo(User, { foreignKey: 'reviewedByUserId', as: 'reviewedBy' });
User.hasMany(CandidateRegistration, { foreignKey: 'userId', as: 'candidateRegistrations' });
Location.hasMany(CandidateRegistration, { foreignKey: 'locationId', as: 'candidateRegistrations' });

// OnboardingEvent associations
OnboardingEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(OnboardingEvent, { foreignKey: 'userId', as: 'onboardingEvents' });

module.exports = {
  sequelize,
  User,
  Article,
  Location,
  LocationLink,
  LocationRequest,
  LocationSection,
  LocationRole,
  UserLocationRole,
  LocationElectionVote,
  Poll,
  PollOption,
  PollVote,
  CivicQuestion,
  CivicQuestionVote,
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
  HomepageSettings,
  Manifest,
  ManifestAcceptance,
  Tag,
  TaggableItem,
  Topic,
  TopicExternalLink,
  TopicFollow,
  Notification,
  IpAccessRule,
  GeoVisit,
  CountryFunding,
  CountryAccessRule,
  GeoAccessSetting,
  Organization,
  OrganizationMember,
  OrganizationRole,
  OrganizationClaimRequest,
  OrganizationAnalytics,
  UserPoliticalAffiliation,
  NewsletterSubscriber,
  NewsletterCampaign,
  NewsletterSendLog,
  PushSubscription,
  WorkerToken,
  MunicipalityDistrictMap,
  CandidateRegistration,
  OnboardingEvent,
  MediaAsset,
};
