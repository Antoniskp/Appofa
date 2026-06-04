const express = require('express');
const { Op } = require('sequelize');
const { Poll, Suggestion, Organization, User } = require('../models');
const { shouldHideSuggestionAuthor } = require('../utils/suggestionAuthorVisibility');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

function mapOfficialPostItem(item, contentType, viewer = null) {
  const data = item.toJSON ? item.toJSON() : item;
  let author = contentType === 'poll' ? data.creator : data.author;
  if (contentType === 'suggestion' && shouldHideSuggestionAuthor(data, viewer)) {
    author = null;
  }
  return {
    id: data.id,
    contentType,
    organizationId: data.organizationId,
    title: data.title,
    body: contentType === 'poll' ? data.description : data.body,
    visibility: data.visibility === 'public' ? 'public' : 'members_only',
    isOfficialPost: Boolean(data.isOfficialPost),
    officialPostScope: data.officialPostScope || null,
    createdAt: data.createdAt,
    organization: data.organization || null,
    author: author
      ? {
        id: author.id,
        username: author.username,
        avatar: author.avatar || null,
        avatarColor: author.avatarColor || null,
      }
      : null,
  };
}

router.get('/', optionalAuthMiddleware, apiLimiter, async (req, res) => {
  try {
    const where = {
      isOfficialPost: true,
      visibility: 'public',
      officialPostScope: {
        [Op.in]: ['platform', null],
      },
    };

    const [polls, suggestions] = await Promise.all([
      Poll.findAll({
        where,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'avatar', 'avatarColor'],
          },
          {
            model: Organization,
            as: 'organization',
            where: {
              type: {
                [Op.in]: ['party', 'institution'],
              },
            },
            attributes: ['id', 'name', 'slug', 'type', 'isVerified'],
            required: true,
          },
        ],
        order: [['createdAt', 'DESC']],
      }),
      Suggestion.findAll({
        where,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'avatar', 'avatarColor'],
          },
          {
            model: Organization,
            as: 'organization',
            where: {
              type: {
                [Op.in]: ['party', 'institution'],
              },
            },
            attributes: ['id', 'name', 'slug', 'type', 'isVerified'],
            required: true,
          },
        ],
        order: [['createdAt', 'DESC']],
      }),
    ]);

    const officialPosts = [
      ...polls.map((poll) => mapOfficialPostItem(poll, 'poll', req.user || null)),
      ...suggestions.map((suggestion) => mapOfficialPostItem(suggestion, 'suggestion', req.user || null)),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      data: { officialPosts },
    });
  } catch (error) {
    console.error('officialPostsRoutes.get / error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch official posts.' });
  }
});

module.exports = router;
