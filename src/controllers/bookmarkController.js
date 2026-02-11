const { Bookmark, Article, Poll, PollOption, PollVote, User } = require('../models');
const { Op } = require('sequelize');
const { normalizeEnum, normalizeInteger } = require('../utils/validators');

const BOOKMARK_ENTITY_TYPES = ['article', 'poll'];

const validateBookmarkTarget = async (entityType, entityId) => {
  const entityTypeResult = normalizeEnum(entityType, BOOKMARK_ENTITY_TYPES, 'Entity type');
  if (entityTypeResult.error) {
    return { error: entityTypeResult.error };
  }

  const entityIdResult = normalizeInteger(entityId, 'Entity ID', 1);
  if (entityIdResult.error) {
    return { error: entityIdResult.error };
  }

  const targetId = entityIdResult.value;
  const model = entityTypeResult.value === 'article' ? Article : Poll;
  const target = await model.findByPk(targetId, { attributes: ['id'] });

  if (!target) {
    return { error: `${entityTypeResult.value} not found.` };
  }

  return { entityType: entityTypeResult.value, entityId: targetId };
};

const validateCountTarget = async (entityType, entityId, user) => {
  const entityTypeResult = normalizeEnum(entityType, BOOKMARK_ENTITY_TYPES, 'Entity type');
  if (entityTypeResult.error) {
    return { error: entityTypeResult.error, status: 400 };
  }

  const entityIdResult = normalizeInteger(entityId, 'Entity ID', 1);
  if (entityIdResult.error) {
    return { error: entityIdResult.error, status: 400 };
  }

  const targetId = entityIdResult.value;
  const isAdmin = user?.role === 'admin';

  if (entityTypeResult.value === 'article') {
    const article = await Article.findByPk(targetId, {
      attributes: ['id', 'status', 'authorId']
    });
    if (!article) {
      return { error: 'Article not found.', status: 404 };
    }
    if (article.status !== 'published' && (!user || (!isAdmin && user.id !== article.authorId))) {
      return { error: 'Access denied.', status: 403 };
    }
  }

  if (entityTypeResult.value === 'poll') {
    const poll = await Poll.findByPk(targetId, {
      attributes: ['id', 'visibility', 'creatorId']
    });
    if (!poll) {
      return { error: 'Poll not found.', status: 404 };
    }
    if (poll.visibility === 'private' && (!user || (!isAdmin && user.id !== poll.creatorId))) {
      return { error: 'Access denied.', status: 403 };
    }
    if (poll.visibility === 'locals_only' && !user) {
      return { error: 'Authentication required.', status: 403 };
    }
  }

  return { entityType: entityTypeResult.value, entityId: targetId };
};

const bookmarkController = {
  count: async (req, res) => {
    try {
      const { entity_type: entityType, entity_id: entityId } = req.query;
      const validation = await validateCountTarget(entityType, entityId, req.user);
      if (validation.error) {
        return res.status(validation.status || 400).json({
          success: false,
          message: validation.error
        });
      }

      const total = await Bookmark.count({
        where: {
          entityType: validation.entityType,
          entityId: validation.entityId
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          count: total
        }
      });
    } catch (error) {
      console.error('Count bookmarks error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching bookmark count.'
      });
    }
  },
  list: async (req, res) => {
    try {
      const { entity_type: entityType, page = 1, limit = 12 } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
      const offset = (pageNum - 1) * limitNum;

      const where = { userId: req.user.id };
      if (entityType) {
        const typeResult = normalizeEnum(entityType, BOOKMARK_ENTITY_TYPES, 'Entity type');
        if (typeResult.error) {
          return res.status(400).json({
            success: false,
            message: typeResult.error
          });
        }
        where.entityType = typeResult.value;
      }

      const { count, rows } = await Bookmark.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset
      });

      const articleIds = rows
        .filter((bookmark) => bookmark.entityType === 'article')
        .map((bookmark) => bookmark.entityId);
      const pollIds = rows
        .filter((bookmark) => bookmark.entityType === 'poll')
        .map((bookmark) => bookmark.entityId);

      const isAdmin = req.user.role === 'admin';

      const articles = articleIds.length > 0 ? await Article.findAll({
        where: { id: { [Op.in]: articleIds } },
        attributes: [
          'id',
          'title',
          'summary',
          'content',
          'category',
          'tags',
          'status',
          'type',
          'createdAt',
          'bannerImageUrl',
          'authorId',
          'hideAuthor'
        ],
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }
        ]
      }) : [];

      const polls = pollIds.length > 0 ? await Poll.findAll({
        where: { id: { [Op.in]: pollIds } },
        attributes: [
          'id',
          'title',
          'description',
          'status',
          'type',
          'category',
          'visibility',
          'resultsVisibility',
          'deadline',
          'createdAt',
          'creatorId',
          'hideCreator'
        ],
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName']
          },
          {
            model: PollOption,
            as: 'options',
            attributes: ['id', 'text', 'order'],
            include: [
              {
                model: PollVote,
                as: 'votes',
                attributes: ['id']
              }
            ]
          }
        ],
        order: [[{ model: PollOption, as: 'options' }, 'order', 'ASC']]
      }) : [];

      const articleMap = new Map();
      articles.forEach((article) => {
        const data = article.toJSON();
        if (data.status !== 'published' && data.authorId !== req.user.id && !isAdmin) {
          return;
        }
        if (data.hideAuthor && data.authorId !== req.user.id && !isAdmin) {
          data.author = null;
        }
        articleMap.set(data.id, data);
      });

      const pollMap = new Map();
      polls.forEach((poll) => {
        const data = poll.toJSON();
        if (data.visibility === 'private' && data.creatorId !== req.user.id) {
          return;
        }
        if (data.hideCreator && data.creatorId !== req.user.id && !isAdmin) {
          data.creator = null;
        }
        const totalVotes = Array.isArray(data.options)
          ? data.options.reduce((sum, option) => sum + (option.votes ? option.votes.length : 0), 0)
          : 0;
        data.options = Array.isArray(data.options)
          ? data.options.map((option) => ({
            id: option.id,
            text: option.text,
            order: option.order,
            voteCount: option.votes ? option.votes.length : 0
          }))
          : [];
        data.totalVotes = totalVotes;
        pollMap.set(data.id, data);
      });

      const items = rows
        .map((bookmark) => {
          const entity = bookmark.entityType === 'article'
            ? articleMap.get(bookmark.entityId)
            : pollMap.get(bookmark.entityId);

          if (!entity) {
            return null;
          }

          return {
            id: bookmark.id,
            entityType: bookmark.entityType,
            entityId: bookmark.entityId,
            createdAt: bookmark.createdAt,
            entity
          };
        })
        .filter(Boolean);

      return res.status(200).json({
        success: true,
        data: {
          items,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(count / limitNum),
            totalItems: count,
            itemsPerPage: limitNum
          }
        }
      });
    } catch (error) {
      console.error('List bookmarks error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching bookmarks.'
      });
    }
  },
  getStatus: async (req, res) => {
    try {
      const { entity_type: entityType, entity_id: entityId } = req.query;
      const validation = await validateBookmarkTarget(entityType, entityId);
      if (validation.error) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      const existing = await Bookmark.findOne({
        where: {
          userId: req.user.id,
          entityType: validation.entityType,
          entityId: validation.entityId
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          bookmarked: !!existing
        }
      });
    } catch (error) {
      console.error('Get bookmark status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching bookmark status.'
      });
    }
  },

  toggle: async (req, res) => {
    try {
      const { entity_type: entityType, entity_id: entityId } = req.body;
      const validation = await validateBookmarkTarget(entityType, entityId);
      if (validation.error) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      const existing = await Bookmark.findOne({
        where: {
          userId: req.user.id,
          entityType: validation.entityType,
          entityId: validation.entityId
        }
      });

      if (existing) {
        await existing.destroy();
        return res.status(200).json({
          success: true,
          data: {
            bookmarked: false
          }
        });
      }

      await Bookmark.create({
        userId: req.user.id,
        entityType: validation.entityType,
        entityId: validation.entityId
      });

      return res.status(200).json({
        success: true,
        data: {
          bookmarked: true
        }
      });
    } catch (error) {
      console.error('Toggle bookmark error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating bookmark.'
      });
    }
  }
};

module.exports = bookmarkController;
