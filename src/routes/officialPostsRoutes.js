const express = require('express');
const { Op } = require('sequelize');
const { Poll, Suggestion, Organization, User } = require('../models');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

function mapOfficialPostItem(item, contentType) {
  const data = item.toJSON ? item.toJSON() : item;
  const author = contentType === 'poll' ? data.creator : data.author;
  return {
    id: data.id,
    contentType,
    organizationId: data.organizationId,
    title: data.title,
    body: contentType === 'poll' ? data.description : data.body,
    visibility: data.visibility,
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

router.get('/', apiLimiter, optionalAuthMiddleware, async (req, res) => {
  try {
    const where = {
      isOfficialPost: true,
      visibility: 'public',
      officialPostScope: {
        [Op.or]: ['platform', null],
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
      ...polls.map((poll) => mapOfficialPostItem(poll, 'poll')),
      ...suggestions.map((suggestion) => mapOfficialPostItem(suggestion, 'suggestion')),
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
