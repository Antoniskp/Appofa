const { Op } = require('sequelize');
const { Suggestion, Solution, SuggestionVote, User, Location, sequelize } = require('../models');
const { normalizeRequiredText, normalizeOptionalText, normalizeEnum, normalizeInteger } = require('../utils/validators');
const badgeService = require('../services/badgeService');

const SUGGESTION_TYPES = ['idea', 'problem', 'problem_request', 'location_suggestion'];
const SUGGESTION_STATUSES = ['open', 'under_review', 'implemented', 'rejected'];
const VOTE_VALUES = [-1, 1];

/**
 * Compute the aggregate score (sum of vote values) for a given target.
 */
async function computeScore(targetType, targetId) {
  const result = await SuggestionVote.sum('value', {
    where: { targetType, targetId }
  });
  return result || 0;
}

/**
 * Compute separate upvote and downvote counts for a given target.
 */
async function computeCounts(targetType, targetId) {
  const [upvotes, downvotes] = await Promise.all([
    SuggestionVote.count({ where: { targetType, targetId, value: 1 } }),
    SuggestionVote.count({ where: { targetType, targetId, value: -1 } }),
  ]);
  return { upvotes, downvotes };
}

/**
 * Get the caller's current vote value for a target (null if no vote).
 */
async function getMyVote(userId, targetType, targetId) {
  if (!userId) return null;
  const vote = await SuggestionVote.findOne({
    where: { userId, targetType, targetId },
    attributes: ['value']
  });
  return vote ? vote.value : null;
}

/**
 * Attach upvotes, downvotes, score, and myVote to a plain suggestion/solution object.
 */
async function attachVoteInfo(obj, targetType, userId) {
  const { upvotes, downvotes } = await computeCounts(targetType, obj.id);
  const myVote = await getMyVote(userId, targetType, obj.id);
  return { ...obj, upvotes, downvotes, score: upvotes - downvotes, myVote };
}

const suggestionController = {
  /**
   * GET /api/suggestions
   * List suggestions with optional filters and sorting.
   */
  getSuggestions: async (req, res) => {
    try {
      const { type, status, locationId, authorId, sort = 'newest', page = 1, limit = 12, category, search } = req.query;

      const where = {};
      if (type && SUGGESTION_TYPES.includes(type)) where.type = type;
      if (status && SUGGESTION_STATUSES.includes(status)) where.status = status;
      if (category) where.category = category;
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { body: { [Op.like]: `%${search}%` } }
        ];
      }
      if (locationId) {
        const parsedLocationId = parseInt(locationId, 10);
        if (!isNaN(parsedLocationId)) where.locationId = parsedLocationId;
      }
      if (authorId) {
        const parsedAuthorId = parseInt(authorId, 10);
        if (!isNaN(parsedAuthorId)) where.authorId = parsedAuthorId;
      }

      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
      const offset = (parsedPage - 1) * parsedLimit;

      let order;
      if (sort === 'newest') {
        order = [['createdAt', 'DESC']];
      } else {
        // For 'top', we sort in memory after score aggregation below
        order = [['createdAt', 'DESC']];
      }

      const { count, rows } = await Suggestion.findAndCountAll({
        where,
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'avatar', 'avatarColor'] },
          { model: Location, as: 'location', attributes: ['id', 'name', 'slug', 'type'] }
        ],
        order,
        limit: parsedLimit,
        offset,
        distinct: true
      });

      const userId = req.user?.id;
      let suggestions = await Promise.all(
        rows.map(async (s) => {
          const plain = s.toJSON();
          return attachVoteInfo(plain, 'suggestion', userId);
        })
      );

      if (sort === 'top') {
        suggestions = suggestions.sort((a, b) => b.score - a.score);
      }

      return res.json({
        success: true,
        data: suggestions,
        pagination: {
          total: count,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(count / parsedLimit)
        }
      });
    } catch (error) {
      console.error('Get suggestions error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching suggestions.' });
    }
  },

  /**
   * GET /api/suggestions/:id
   * Get a single suggestion with solutions sorted by score desc.
   */
  getSuggestionById: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid suggestion ID.' });
      }

      const suggestion = await Suggestion.findByPk(id, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'avatar', 'avatarColor'] },
          { model: Location, as: 'location', attributes: ['id', 'name', 'slug', 'type'] },
          {
            model: Solution,
            as: 'solutions',
            include: [
              { model: User, as: 'author', attributes: ['id', 'username', 'avatar', 'avatarColor'] }
            ]
          }
        ]
      });

      if (!suggestion) {
        return res.status(404).json({ success: false, message: 'Suggestion not found.' });
      }

      const userId = req.user?.id;
      const plain = suggestion.toJSON();
      const withVotes = await attachVoteInfo(plain, 'suggestion', userId);

      // Attach score and myVote to each solution and sort by score desc
      const solutionsWithVotes = await Promise.all(
        (plain.solutions || []).map((sol) => attachVoteInfo(sol, 'solution', userId))
      );
      solutionsWithVotes.sort((a, b) => b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt));

      return res.json({
        success: true,
        data: { ...withVotes, solutions: solutionsWithVotes }
      });
    } catch (error) {
      console.error('Get suggestion by ID error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching suggestion.' });
    }
  },

  /**
   * POST /api/suggestions
   * Create a new suggestion (auth required).
   */
  createSuggestion: async (req, res) => {
    try {
      const { title, body, type, locationId, status, category } = req.body;

      const titleResult = normalizeRequiredText(title, 'Title', 5, 200);
      if (titleResult.error) return res.status(400).json({ success: false, message: titleResult.error });

      const bodyResult = normalizeRequiredText(body, 'Body', 10, 10000);
      if (bodyResult.error) return res.status(400).json({ success: false, message: bodyResult.error });

      const typeResult = normalizeEnum(type || 'idea', SUGGESTION_TYPES, 'Type');
      if (typeResult.error) return res.status(400).json({ success: false, message: typeResult.error });

      let parsedLocationId = null;
      if (locationId !== undefined && locationId !== null && locationId !== '') {
        parsedLocationId = parseInt(locationId, 10);
        if (isNaN(parsedLocationId)) {
          return res.status(400).json({ success: false, message: 'Invalid locationId.' });
        }
        const loc = await Location.findByPk(parsedLocationId);
        if (!loc) {
          return res.status(400).json({ success: false, message: 'Location not found.' });
        }
      }

      const suggestion = await Suggestion.create({
        title: titleResult.value,
        body: bodyResult.value,
        type: typeResult.value,
        locationId: parsedLocationId,
        authorId: req.user.id,
        status: 'open',
        ...(category ? { category } : {})
      });

      const created = await Suggestion.findByPk(suggestion.id, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'avatar', 'avatarColor'] },
          { model: Location, as: 'location', attributes: ['id', 'name', 'slug', 'type'] }
        ]
      });

      return res.status(201).json({
        success: true,
        data: { ...created.toJSON(), upvotes: 0, downvotes: 0, score: 0, myVote: null },
        message: 'Suggestion created successfully.'
      });
    } catch (error) {
      console.error('Create suggestion error:', error);
      return res.status(500).json({ success: false, message: 'Error creating suggestion.' });
    }
  },

  /**
   * PATCH /api/suggestions/:id
   * Update suggestion status (owner or admin/moderator).
   */
  updateSuggestion: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid suggestion ID.' });

      const suggestion = await Suggestion.findByPk(id);
      if (!suggestion) return res.status(404).json({ success: false, message: 'Suggestion not found.' });

      const isOwner = suggestion.authorId === req.user.id;
      const isPrivileged = ['admin', 'moderator'].includes(req.user.role);

      if (!isOwner && !isPrivileged) {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
      }

      const updates = {};

      if (req.body.title !== undefined) {
        const r = normalizeRequiredText(req.body.title, 'Title', 5, 200);
        if (r.error) return res.status(400).json({ success: false, message: r.error });
        updates.title = r.value;
      }

      if (req.body.body !== undefined) {
        const r = normalizeRequiredText(req.body.body, 'Body', 10, 10000);
        if (r.error) return res.status(400).json({ success: false, message: r.error });
        updates.body = r.value;
      }

      if (req.body.type !== undefined) {
        const r = normalizeEnum(req.body.type, SUGGESTION_TYPES, 'Type');
        if (r.error) return res.status(400).json({ success: false, message: r.error });
        updates.type = r.value;
      }

      if (req.body.status !== undefined) {
        const r = normalizeEnum(req.body.status, SUGGESTION_STATUSES, 'Status');
        if (r.error) return res.status(400).json({ success: false, message: r.error });
        updates.status = r.value;
      }

      if (req.body.locationId !== undefined) {
        const locId = req.body.locationId;
        if (locId === null || locId === '') {
          updates.locationId = null;
        } else {
          const parsedLocId = parseInt(locId, 10);
          if (isNaN(parsedLocId)) {
            return res.status(400).json({ success: false, message: 'Invalid locationId.' });
          }
          const loc = await Location.findByPk(parsedLocId);
          if (!loc) {
            return res.status(400).json({ success: false, message: 'Location not found.' });
          }
          updates.locationId = parsedLocId;
        }
      }

      if (req.body.category !== undefined) {
        updates.category = req.body.category || null;
      }

      await suggestion.update(updates);

      const updated = await Suggestion.findByPk(suggestion.id, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'avatar', 'avatarColor'] },
          { model: Location, as: 'location', attributes: ['id', 'name', 'slug', 'type'] }
        ]
      });

      return res.json({ success: true, data: updated, message: 'Suggestion updated.' });
    } catch (error) {
      console.error('Update suggestion error:', error);
      return res.status(500).json({ success: false, message: 'Error updating suggestion.' });
    }
  },

  /**
   * GET /api/suggestions/:id/solutions
   * List solutions for a suggestion, sorted by score desc.
   */
  getSolutions: async (req, res) => {
    try {
      const suggestionId = parseInt(req.params.id, 10);
      if (isNaN(suggestionId)) return res.status(400).json({ success: false, message: 'Invalid suggestion ID.' });

      const suggestion = await Suggestion.findByPk(suggestionId);
      if (!suggestion) return res.status(404).json({ success: false, message: 'Suggestion not found.' });

      const solutions = await Solution.findAll({
        where: { suggestionId },
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'avatar', 'avatarColor'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      const userId = req.user?.id;
      const withVotes = await Promise.all(
        solutions.map((s) => attachVoteInfo(s.toJSON(), 'solution', userId))
      );
      withVotes.sort((a, b) => b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt));

      return res.json({ success: true, data: withVotes });
    } catch (error) {
      console.error('Get solutions error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching solutions.' });
    }
  },

  /**
   * POST /api/suggestions/:id/solutions
   * Create a solution under a suggestion (auth required).
   */
  createSolution: async (req, res) => {
    try {
      const suggestionId = parseInt(req.params.id, 10);
      if (isNaN(suggestionId)) return res.status(400).json({ success: false, message: 'Invalid suggestion ID.' });

      const suggestion = await Suggestion.findByPk(suggestionId);
      if (!suggestion) return res.status(404).json({ success: false, message: 'Suggestion not found.' });

      if (suggestion.status === 'implemented' || suggestion.status === 'rejected') {
        return res.status(400).json({ success: false, message: 'Cannot add solutions to a closed suggestion.' });
      }

      const bodyResult = normalizeRequiredText(req.body.body, 'Body', 10, 5000);
      if (bodyResult.error) return res.status(400).json({ success: false, message: bodyResult.error });

      const solution = await Solution.create({
        suggestionId,
        body: bodyResult.value,
        authorId: req.user.id
      });

      const created = await Solution.findByPk(solution.id, {
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'avatar', 'avatarColor'] }
        ]
      });

      return res.status(201).json({
        success: true,
        data: { ...created.toJSON(), upvotes: 0, downvotes: 0, score: 0, myVote: null },
        message: 'Solution created successfully.'
      });
    } catch (error) {
      console.error('Create solution error:', error);
      return res.status(500).json({ success: false, message: 'Error creating solution.' });
    }
  },

  /**
   * POST /api/suggestions/:id/vote
   * Upvote or downvote a suggestion (auth required).
   * Upsert behavior: if same vote exists → remove it (toggle off).
   * If different vote exists → update it.
   * If no vote exists → create it.
   */
  voteSuggestion: async (req, res) => {
    try {
      const targetId = parseInt(req.params.id, 10);
      if (isNaN(targetId)) return res.status(400).json({ success: false, message: 'Invalid suggestion ID.' });

      const suggestion = await Suggestion.findByPk(targetId);
      if (!suggestion) return res.status(404).json({ success: false, message: 'Suggestion not found.' });

      return handleVote(req, res, 'suggestion', targetId);
    } catch (error) {
      console.error('Vote suggestion error:', error);
      return res.status(500).json({ success: false, message: 'Error processing vote.' });
    }
  },

  /**
   * DELETE /api/suggestions/:id
   * Delete a suggestion (owner or admin only).
   */
  deleteSuggestion: async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid suggestion ID.' });

      const suggestion = await Suggestion.findByPk(id);
      if (!suggestion) return res.status(404).json({ success: false, message: 'Suggestion not found.' });

      const isOwner = suggestion.authorId === req.user.id;
      const isPrivileged = ['admin', 'moderator'].includes(req.user.role);

      if (!isOwner && !isPrivileged) {
        return res.status(403).json({ success: false, message: 'Forbidden.' });
      }

      await suggestion.destroy();

      return res.json({ success: true, message: 'Suggestion deleted.' });
    } catch (error) {
      console.error('Delete suggestion error:', error);
      return res.status(500).json({ success: false, message: 'Error deleting suggestion.' });
    }
  },

  /**
   * POST /api/solutions/:id/vote
   * Upvote or downvote a solution (auth required).
   */
  voteSolution: async (req, res) => {
    try {
      const targetId = parseInt(req.params.id, 10);
      if (isNaN(targetId)) return res.status(400).json({ success: false, message: 'Invalid solution ID.' });

      const solution = await Solution.findByPk(targetId);
      if (!solution) return res.status(404).json({ success: false, message: 'Solution not found.' });

      return handleVote(req, res, 'solution', targetId);
    } catch (error) {
      console.error('Vote solution error:', error);
      return res.status(500).json({ success: false, message: 'Error processing vote.' });
    }
  },

  /**
   * GET /api/suggestions/category-counts
   * Get suggestion counts grouped by category.
   */
  getCategoryCounts: async (req, res) => {
    try {
      const where = { category: { [Op.ne]: null } };
      const { status } = req.query;
      if (status) where.status = status;

      const rows = await Suggestion.findAll({
        attributes: [
          'category',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: ['category'],
        raw: true
      });

      const counts = {};
      rows.forEach((row) => {
        if (row.category && row.category.trim()) {
          counts[row.category] = parseInt(row.count, 10);
        }
      });

      return res.json({ success: true, data: { counts } });
    } catch (error) {
      console.error('Get suggestion category counts error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching suggestion category counts.' });
    }
  }
};

/**
 * Shared vote upsert/toggle logic.
 */
async function handleVote(req, res, targetType, targetId) {
  const value = parseInt(req.body.value, 10);
  if (!VOTE_VALUES.includes(value)) {
    return res.status(400).json({ success: false, message: 'Vote value must be 1 or -1.' });
  }

  const userId = req.user.id;

  const existing = await SuggestionVote.findOne({
    where: { userId, targetType, targetId }
  });

  if (existing) {
    if (existing.value === value) {
      // Same vote → remove (toggle off)
      await existing.destroy();
      const { upvotes, downvotes } = await computeCounts(targetType, targetId);
      return res.json({ success: true, data: { upvotes, downvotes, score: upvotes - downvotes, myVote: null }, message: 'Vote removed.' });
    } else {
      // Different vote → update
      await existing.update({ value });
      const { upvotes, downvotes } = await computeCounts(targetType, targetId);
      return res.json({ success: true, data: { upvotes, downvotes, score: upvotes - downvotes, myVote: value }, message: 'Vote updated.' });
    }
  } else {
    // No existing vote → create
    await SuggestionVote.create({ userId, targetType, targetId, value });
    const { upvotes, downvotes } = await computeCounts(targetType, targetId);
    badgeService.evaluate(userId).catch(err => console.error('Badge evaluation error:', err));
    return res.json({ success: true, data: { upvotes, downvotes, score: upvotes - downvotes, myVote: value }, message: 'Vote recorded.' });
  }
}

module.exports = suggestionController;
