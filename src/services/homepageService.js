'use strict';

const { Op, QueryTypes, fn, col } = require('sequelize');
const articleService = require('../services/articleService');
const pollService = require('../services/pollService');
const locationService = require('../services/locationService');
const { attachTags } = require('../utils/tagUtils');
const { getAncestorLocationIds, getDescendantLocationIds } = require('../utils/locationUtils');
const { shouldHideSuggestionAuthor } = require('../utils/suggestionAuthorVisibility');
const {
  HomepageSettings,
  Manifest,
  Suggestion,
  SuggestionVote,
  User,
  Location,
  Organization,
  Tag,
  TaggableItem,
  sequelize,
} = require('../models');

const DEFAULT_MANIFEST_SECTION = { enabled: true, audience: 'all' };
const DEFAULT_FEATURED_POLL = { enabled: false, audience: 'all', pollId: null };
const HOMEPAGE_SUPPORTERS_LIMIT = 8;
const HOMEPAGE_TAG_LIMIT = 5;

const getClientIp = (req) =>
  req.ip || (req.ips && req.ips[0]) || req.socket?.remoteAddress;

const getUserAgent = (req) => req.headers['user-agent'] || 'unknown';

async function getOrCreateSettings() {
  let settings = await HomepageSettings.findOne();
  if (!settings) {
    settings = await HomepageSettings.create({
      manifestSection: DEFAULT_MANIFEST_SECTION,
      featuredPoll: DEFAULT_FEATURED_POLL,
    });
  }
  return {
    manifestSection: settings.manifestSection,
    featuredPoll: settings.featuredPoll,
  };
}

async function getTopTags(entityType) {
  const count = fn('COUNT', col('taggableItems.id'));
  const rows = await Tag.findAll({
    attributes: ['name', [count, 'usageCount']],
    include: [{ model: TaggableItem, as: 'taggableItems', where: { entityType }, required: true, attributes: [] }],
    group: ['Tag.id', 'Tag.name'],
    order: [[count, 'DESC'], ['name', 'ASC']],
    limit: HOMEPAGE_TAG_LIMIT,
    subQuery: false,
    raw: true,
  });
  return rows.map(tag => tag.name);
}

async function buildSuggestionWhere(user) {
  if (!user) {
    return { visibility: 'public' };
  }

  if (user.role === 'admin') {
    return {};
  }

  const userRecord = await User.findByPk(user.id, { attributes: ['homeLocationId'] });
  const homeLocationId = userRecord?.homeLocationId;
  if (!homeLocationId) {
    return { visibility: { [Op.in]: ['public', 'private'] } };
  }

  const ancestorIds = await getAncestorLocationIds(homeLocationId, true);
  return {
    [Op.or]: [
      { visibility: { [Op.in]: ['public', 'private'] } },
      { [Op.and]: [{ visibility: 'locals_only' }, { locationId: { [Op.in]: ancestorIds } }] },
    ],
  };
}

async function getTopSuggestions(user, locationId) {
  const where = await buildSuggestionWhere(user);
  if (locationId) where.locationId = { [Op.in]: await getDescendantLocationIds(locationId, true) };
  const voteScore = sequelize.literal(`(
    SELECT COALESCE(SUM("value"), 0)
    FROM "SuggestionVotes"
    WHERE "SuggestionVotes"."targetType" = 'suggestion'
      AND "SuggestionVotes"."targetId" = "Suggestion"."id"
  )`);
  const upvotes = sequelize.literal(`(
    SELECT COUNT(*)
    FROM "SuggestionVotes"
    WHERE "SuggestionVotes"."targetType" = 'suggestion'
      AND "SuggestionVotes"."targetId" = "Suggestion"."id"
      AND "SuggestionVotes"."value" = 1
  )`);
  const downvotes = sequelize.literal(`(
    SELECT COUNT(*)
    FROM "SuggestionVotes"
    WHERE "SuggestionVotes"."targetType" = 'suggestion'
      AND "SuggestionVotes"."targetId" = "Suggestion"."id"
      AND "SuggestionVotes"."value" = -1
  )`);

  const rows = await Suggestion.findAll({
    where,
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'avatar', 'avatarColor'] },
      {
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'slug', 'type', 'logo', 'isVerified'],
        required: false,
      },
      { model: Location, as: 'location', attributes: ['id', 'name', 'slug', 'imageUrl'], required: false },
    ],
    attributes: {
      include: [
        [voteScore, 'score'],
        [upvotes, 'upvotes'],
        [downvotes, 'downvotes'],
      ],
    },
    order: [[voteScore, 'DESC'], ['createdAt', 'DESC']],
    limit: 3,
  });

  const suggestions = rows.map((row) => {
    const data = shouldHideSuggestionAuthor(row.toJSON(), user) ? { ...row.toJSON(), author: null } : row.toJSON();
    return {
      ...data,
      score: Number(data.score) || 0,
      upvotes: Number(data.upvotes) || 0,
      downvotes: Number(data.downvotes) || 0,
      myVote: null,
      myVoteIdentityVisibility: null,
      publicVoters: { up: [], down: [] },
    };
  });

  if (user && suggestions.length > 0) {
    const votes = await SuggestionVote.findAll({
      where: {
        userId: user.id,
        targetType: 'suggestion',
        targetId: { [Op.in]: suggestions.map((suggestion) => suggestion.id) },
      },
      attributes: ['targetId', 'value', 'identityVisibility'],
      raw: true,
    });
    const voteMap = Object.fromEntries(votes.map((vote) => [vote.targetId, vote]));
    suggestions.forEach((suggestion) => {
      const vote = voteMap[suggestion.id];
      if (vote) {
        suggestion.myVote = vote.value;
        suggestion.myVoteIdentityVisibility = vote.identityVisibility;
      }
    });
  }

  return attachTags('suggestion', suggestions);
}

async function getPrefectures() {
  const greece = await locationService.getLocations({ type: 'country', code: 'GR', limit: 1 });
  if (!greece.success) throw new Error('Locations unavailable');
  const greeceId = greece.locations?.length > 0 ? greece.locations[0].id : null;
  if (!greeceId) return [];

  const prefectures = await locationService.getLocations({
    type: 'prefecture',
    parent_id: greeceId,
    includeUserCounts: true,
    includeCandidatePreview: true,
    limit: 50,
  });
  if (!prefectures.success) throw new Error('Locations unavailable');
  return prefectures.locations || [];
}

async function getRandomSupportersForManifests(manifestIds) {
  if (!manifestIds.length) return {};

  const rows = await sequelize.query(
    `SELECT *
     FROM (
       SELECT
         ma."manifestId" AS "manifestId",
         u."id" AS "id",
         u."username" AS "username",
         u."firstNameNative" AS "firstName",
         u."lastNameNative" AS "lastName",
         u."avatar" AS "avatar",
         u."avatarColor" AS "avatarColor",
         u."displayBadgeSlug" AS "displayBadgeSlug",
         u."displayBadgeTier" AS "displayBadgeTier",
         ROW_NUMBER() OVER (PARTITION BY ma."manifestId" ORDER BY RANDOM()) AS rn
       FROM "ManifestAcceptances" ma
       JOIN "Users" u ON u."id" = ma."userId"
       WHERE ma."manifestId" IN (:manifestIds)
     ) ranked
     WHERE rn <= :limit`,
    {
      replacements: { manifestIds, limit: HOMEPAGE_SUPPORTERS_LIMIT },
      type: QueryTypes.SELECT,
    }
  );

  return rows.reduce((acc, row) => {
    if (!acc[row.manifestId]) acc[row.manifestId] = [];
    acc[row.manifestId].push({
      id: row.id,
      username: row.username,
      firstName: row.firstName,
      lastName: row.lastName,
      avatar: row.avatar,
      avatarColor: row.avatarColor,
      displayBadgeSlug: row.displayBadgeSlug || null,
      displayBadgeTier: row.displayBadgeTier || null,
    });
    return acc;
  }, {});
}

async function getManifestData() {
  const manifests = await Manifest.findAll({
    where: { isActive: true },
    order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']],
    attributes: {
      include: [
        [
          sequelize.literal(
            '(SELECT COUNT(*) FROM "ManifestAcceptances" WHERE "ManifestAcceptances"."manifestId" = "Manifest"."id")'
          ),
          'supportersCount',
        ],
      ],
    },
  });

  const supportersByManifestId = await getRandomSupportersForManifests(manifests.map((manifest) => manifest.id));
  return manifests.map((manifest) => ({
    ...manifest.toJSON(),
    supportersCount: parseInt(manifest.get('supportersCount'), 10) || 0,
    randomSupporters: supportersByManifestId[manifest.id] || [],
  }));
}

async function getFeaturedPoll(featuredConfig, user, req) {
  if (!featuredConfig?.enabled || !featuredConfig.pollId) return null;
  const result = await pollService.getPollById(
    featuredConfig.pollId,
    user,
    getClientIp(req),
    getUserAgent(req)
  );
  return result.success ? result.data : null;
}

// Sections are independently recoverable. Keep this allowlist shared with the controller.
const HOMEPAGE_SECTIONS = require('../../config/homepageSections.json');

async function listData(promise, key) {
  const result = await promise;
  if (!result?.success) throw new Error('Section unavailable');
  return result.data?.[key] || [];
}

async function buildHomepagePayload(req, sections = HOMEPAGE_SECTIONS) {
  const user = req.user ? { id: req.user.id, role: req.user.role } : null;
  const locationId = req.query.locationId ? Number(req.query.locationId) : null;
  // Share settings only within this request; never cache personalized payloads.
  let settingsPromise;
  const settings = () => (settingsPromise ||= getOrCreateSettings());
  const loaders = {
    latestArticles: () => listData(articleService.getAllArticles({ status: 'published', type: 'articles', orderBy: 'createdAt', order: 'desc', limit: 3, page: 1 }, user), 'articles'),
    latestNews: () => listData(articleService.getAllArticles({ status: 'published', type: 'news', newsApproved: true, orderBy: 'newsApprovedAt', order: 'desc', limit: 3, page: 1 }, user), 'articles'),
    videos: () => listData(articleService.getAllArticles({ type: 'video', status: 'published', limit: 6, orderBy: 'createdAt', order: 'desc' }, user), 'articles'),
    polls: () => listData(pollService.getAllPolls({ limit: 3, ...(locationId ? { locationId } : {}) }, user, getClientIp(req), getUserAgent(req)), 'polls'),
    suggestions: () => getTopSuggestions(user, locationId),
    prefectures: getPrefectures,
    tags: async () => {
      const [article, suggestion, poll] = await Promise.all(['article', 'suggestion', 'poll'].map(getTopTags));
      return { article, suggestion, poll };
    },
    homepageSettings: settings,
    featuredPoll: async () => getFeaturedPoll((await settings()).featuredPoll, user, req),
    manifestData: getManifestData,
  };
  const results = await Promise.allSettled(sections.map(section => Promise.resolve().then(loaders[section])));
  const data = {};
  const errors = {};
  results.forEach((result, index) => {
    const section = sections[index];
    if (result.status === 'fulfilled') data[section] = result.value;
    else {
      errors[section] = 'unavailable';
      console.error('Homepage section failed:', section, result.reason?.message);
    }
  });
  return { data, errors };
}

module.exports = { buildHomepagePayload, HOMEPAGE_SECTIONS };
