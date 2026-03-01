const { Article, Poll } = require('../models');

/**
 * GET /api/tags/suggestions
 * Returns a deduplicated, sorted list of all tags used across articles and polls.
 * Public endpoint – no authentication required.
 */
const getSuggestions = async (req, res) => {
  try {
    const [articles, polls] = await Promise.all([
      Article.findAll({ attributes: ['tags'] }),
      Poll.findAll({ attributes: ['tags'] }),
    ]);

    const tagSet = new Set();
    [...articles, ...polls].forEach((item) => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach((tag) => {
          if (typeof tag === 'string') {
            const normalized = tag.trim();
            if (normalized) tagSet.add(normalized);
          }
        });
      }
    });

    return res.json({ success: true, tags: [...tagSet].sort() });
  } catch (error) {
    console.error('tagController.getSuggestions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tag suggestions.' });
  }
};

module.exports = { getSuggestions };
