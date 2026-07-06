const { Tag, TaggableItem, sequelize } = require('../models');
const { Op } = require('sequelize');
const { escapeLikePattern } = require('../utils/validators');
const { slugifyTopic } = require('../utils/topicUtils');

const VALID_ENTITY_TYPES = ['article', 'poll', 'suggestion'];

const toTopicDto = (tag) => {
  const items = tag.taggableItems || [];
  const counts = VALID_ENTITY_TYPES.reduce((acc, entityType) => {
    acc[entityType] = items.filter((item) => item.entityType === entityType).length;
    return acc;
  }, {});
  const count = counts.article + counts.poll + counts.suggestion;
  return {
    id: tag.id,
    name: tag.name,
    slug: slugifyTopic(tag.name),
    count,
    counts
  };
};

const findTopicBySlug = async (slug) => {
  const normalizedSlug = slugifyTopic(decodeURIComponent(String(slug || '')));
  if (!normalizedSlug) return null;

  const tags = await Tag.findAll({
    include: [
      {
        model: TaggableItem,
        as: 'taggableItems',
        required: false,
        attributes: ['id', 'entityType']
      }
    ],
    order: [['name', 'ASC']]
  });

  return tags.find((tag) => slugifyTopic(tag.name) === normalizedSlug) || null;
};

/**
 * GET /api/tags/suggestions
 * Returns tags with usage counts from the unified Tags table.
 * Public endpoint – no authentication required.
 *
 * Query params:
 *   ?entityType=article|poll|suggestion  (optional) scope results to one entity type
 *   ?q=partial                           (optional) prefix search on tag name
 */
const getSuggestions = async (req, res) => {
  try {
    const { entityType, q } = req.query;

    const itemWhere = {};
    if (entityType && VALID_ENTITY_TYPES.includes(entityType)) {
      itemWhere.entityType = entityType;
    }

    const tagWhere = {};
    if (q && typeof q === 'string') {
      const prefix = q.trim().toLowerCase();
      if (prefix) {
        const escapedPrefix = escapeLikePattern(prefix);
        const dialect = sequelize.getDialect();
        tagWhere.name = dialect === 'postgres'
          ? { [Op.iLike]: `${escapedPrefix}%` }
          : { [Op.like]: `${escapedPrefix}%` };
      }
    }

    const tags = await Tag.findAll({
      where: tagWhere,
      include: [
        {
          model: TaggableItem,
          as: 'taggableItems',
          where: Object.keys(itemWhere).length ? itemWhere : undefined,
          required: false,
          attributes: ['id']
        }
      ],
      attributes: ['name']
    });

    const result = tags
      .map((tag) => ({
        name: tag.name,
        slug: slugifyTopic(tag.name),
        count: tag.taggableItems ? tag.taggableItems.length : 0
      }))
      // When searching by prefix, include all matching tags (even unused ones)
      // When browsing without a query, only show tags that are actually in use
      .filter((t) => q ? true : t.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return res.json({ success: true, tags: result });
  } catch (error) {
    console.error('tagController.getSuggestions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tag suggestions.' });
  }
};

const getTopics = async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const tagWhere = {};
    if (q && typeof q === 'string') {
      const term = q.trim().toLowerCase();
      if (term) {
        const escapedTerm = escapeLikePattern(term);
        const dialect = sequelize.getDialect();
        tagWhere.name = dialect === 'postgres'
          ? { [Op.iLike]: `%${escapedTerm}%` }
          : { [Op.like]: `%${escapedTerm}%` };
      }
    }

    const tags = await Tag.findAll({
      where: tagWhere,
      include: [
        {
          model: TaggableItem,
          as: 'taggableItems',
          required: false,
          attributes: ['id', 'entityType']
        }
      ],
      order: [['name', 'ASC']]
    });

    const topics = tags
      .map(toTopicDto)
      .filter((topic) => topic.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, parsedLimit);

    return res.json({ success: true, topics });
  } catch (error) {
    console.error('tagController.getTopics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch topics.' });
  }
};

const getTopicBySlug = async (req, res) => {
  try {
    const tag = await findTopicBySlug(req.params.slug);
    if (!tag) {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }

    const topic = toTopicDto(tag);
    if (topic.count === 0) {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }

    return res.json({ success: true, topic });
  } catch (error) {
    console.error('tagController.getTopicBySlug error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch topic.' });
  }
};

module.exports = { getSuggestions, getTopics, getTopicBySlug };
