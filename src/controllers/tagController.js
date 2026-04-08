const { Tag, TaggableItem, sequelize } = require('../models');
const { Op } = require('sequelize');

const VALID_ENTITY_TYPES = ['article', 'poll', 'suggestion'];

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
        const dialect = sequelize.getDialect();
        tagWhere.name = dialect === 'postgres'
          ? { [Op.iLike]: `${prefix}%` }
          : { [Op.like]: `${prefix}%` };
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

module.exports = { getSuggestions };
