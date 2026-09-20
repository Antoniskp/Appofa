'use strict';

const { Op, QueryTypes } = require('sequelize');
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

const toUserObj = (reqUser) =>
  reqUser ? { id: reqUser.id, role: reqUser.role } : null;

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
  const rows = await Tag.findAll({
    include: [
      {
        model: TaggableItem,
        as: 'taggableItems',
        where: { entityType },
        required: true,
        attributes: ['id'],
      },
    ],
    attributes: ['name'],
  });

  return rows
    .map((tag) => ({
      name: tag.name,
      count: tag.taggableItems ? tag.taggableItems.length : 0,
    }))
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, HOMEPAGE_TAG_LIMIT)
    .map((tag) => tag.name);
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
  const greeceId = greece.success && greece.locations?.length > 0 ? greece.locations[0].id : null;
  if (!greeceId) return [];

  const prefectures = await locationService.getLocations({
    type: 'prefecture',
    parent_id: greeceId,
    includeUserCounts: true,
    includeCandidatePreview: true,
    limit: 50,
  });
  return prefectures.success ? prefectures.locations || [] : [];
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

const getHomepagePayload = async (req, res) => {
  const user = toUserObj(req.user);
  const locationId = req.query.locationId ? Number(req.query.locationId) : null;
  if (locationId !== null && (!Number.isSafeInteger(locationId) || locationId < 1)) {
    return res.status(400).json({ success: false, message: 'Invalid location ID.' });
  }

  try {
    const [
      latestArticles,
      latestNews,
      videos,
      polls,
      suggestions,
      prefectures,
      articleTags,
      suggestionTags,
      pollTags,
      homepageSettings,
      manifestData,
    ] = await Promise.all([
      articleService.getAllArticles({ status: 'published', type: 'articles', orderBy: 'createdAt', order: 'desc', limit: 3, page: 1 }, user),
      articleService.getAllArticles({ status: 'published', type: 'news', newsApproved: true, orderBy: 'newsApprovedAt', order: 'desc', limit: 3, page: 1 }, user),
      articleService.getAllArticles({ type: 'video', status: 'published', limit: 6, orderBy: 'createdAt', order: 'desc' }, user),
      pollService.getAllPolls({ limit: 3, ...(locationId ? { locationId } : {}) }, user, getClientIp(req), getUserAgent(req)),
      getTopSuggestions(user, locationId),
      getPrefectures(),
      getTopTags('article'),
      getTopTags('suggestion'),
      getTopTags('poll'),
      getOrCreateSettings(),
      getManifestData(),
    ]);

    const featuredPoll = await getFeaturedPoll(homepageSettings.featuredPoll, user, req);

    return res.json({
      success: true,
      data: {
        latestArticles: latestArticles.success ? latestArticles.data.articles || [] : [],
        latestNews: latestNews.success ? latestNews.data.articles || [] : [],
        videos: videos.success ? videos.data.articles || [] : [],
        polls: polls.success ? polls.data.polls || [] : [],
        suggestions,
        prefectures,
        tags: {
          article: articleTags,
          suggestion: suggestionTags,
          poll: pollTags,
        },
        homepageSettings,
        featuredPoll,
        manifestData,
      },
    });
  } catch (error) {
    console.error('Homepage payload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load homepage payload.' });
  }
};

module.exports = {
  getHomepagePayload,
};
