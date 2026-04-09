const { Endorsement, User } = require('../models');
const { ENDORSEMENT_TOPICS } = require('../models/Endorsement');
const { normalizeInteger } = require('../utils/validators');
const notificationService = require('../services/notificationService');

const PAGE_SIZE = 20;

const endorsementController = {
  /**
   * POST /api/endorsements
   * Body: { endorsedUserId, topic }
   */
  create: async (req, res) => {
    try {
      const { endorsedUserId, topic } = req.body;

      // Validate topic
      if (!topic || !ENDORSEMENT_TOPICS.includes(topic)) {
        return res.status(400).json({
          success: false,
          message: `Invalid topic. Must be one of: ${ENDORSEMENT_TOPICS.join(', ')}`
        });
      }

      // Validate endorsedUserId
      const idResult = normalizeInteger(endorsedUserId, 'Endorsed user ID', 1);
      if (idResult.error) {
        return res.status(400).json({ success: false, message: idResult.error });
      }
      const endorsedId = idResult.value;

      // Prevent self-endorsement
      if (endorsedId === req.user.id) {
        return res.status(400).json({ success: false, message: 'You cannot endorse yourself.' });
      }

      // Verify target user exists
      const targetUser = await User.findByPk(endorsedId, { attributes: ['id'] });
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // Idempotent create
      const [endorsement, created] = await Endorsement.findOrCreate({
        where: { endorserId: req.user.id, endorsedId, topic }
      });

      if (created) {
        notificationService.notifyEndorsement(endorsedId, req.user.id).catch(err => console.error('Notification error:', err));
      }

      return res.status(200).json({
        success: true,
        data: { endorsement: { id: endorsement.id, endorsedId, topic }, created }
      });
    } catch (error) {
      console.error('Endorsement create error:', error);
      return res.status(500).json({ success: false, message: 'Error creating endorsement.' });
    }
  },

  /**
   * DELETE /api/endorsements
   * Body: { endorsedUserId, topic }
   */
  remove: async (req, res) => {
    try {
      const { endorsedUserId, topic } = req.body;

      if (!topic || !ENDORSEMENT_TOPICS.includes(topic)) {
        return res.status(400).json({
          success: false,
          message: `Invalid topic. Must be one of: ${ENDORSEMENT_TOPICS.join(', ')}`
        });
      }

      const idResult = normalizeInteger(endorsedUserId, 'Endorsed user ID', 1);
      if (idResult.error) {
        return res.status(400).json({ success: false, message: idResult.error });
      }
      const endorsedId = idResult.value;

      const deleted = await Endorsement.destroy({
        where: { endorserId: req.user.id, endorsedId, topic }
      });

      return res.status(200).json({
        success: true,
        data: { removed: deleted > 0 }
      });
    } catch (error) {
      console.error('Endorsement remove error:', error);
      return res.status(500).json({ success: false, message: 'Error removing endorsement.' });
    }
  },

  /**
   * GET /api/endorsements/leaderboard?topic=...&page=...
   */
  leaderboard: async (req, res) => {
    try {
      const { topic, page: pageQuery } = req.query;

      if (topic && !ENDORSEMENT_TOPICS.includes(topic)) {
        return res.status(400).json({
          success: false,
          message: `Invalid topic. Must be one of: ${ENDORSEMENT_TOPICS.join(', ')}`
        });
      }

      const page = Math.max(1, parseInt(pageQuery, 10) || 1);
      const offset = (page - 1) * PAGE_SIZE;

      const whereClause = topic ? { topic } : {};

      // Aggregate endorsement counts per user (and topic if specified)
      const { sequelize } = require('../models');
      const results = await Endorsement.findAll({
        where: whereClause,
        attributes: [
          'endorsedId',
          [sequelize.fn('COUNT', sequelize.col('Endorsement.id')), 'endorsementCount']
        ],
        include: [{
          model: User,
          as: 'endorsed',
          attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor', 'role'],
          where: { searchable: true }
        }],
        group: ['endorsedId', 'endorsed.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('Endorsement.id')), 'DESC']],
        limit: PAGE_SIZE,
        offset,
        subQuery: false
      });

      // Get total count of distinct endorsed users for pagination
      const totalCount = await Endorsement.count({
        where: whereClause,
        distinct: true,
        col: 'endorsedId',
        include: [{
          model: User,
          as: 'endorsed',
          where: { searchable: true }
        }]
      });

      const users = results.map((row) => ({
        ...row.endorsed.toJSON(),
        endorsementCount: parseInt(row.get('endorsementCount'), 10)
      }));

      return res.status(200).json({
        success: true,
        data: {
          users,
          topic: topic || null,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / PAGE_SIZE),
            totalItems: totalCount,
            itemsPerPage: PAGE_SIZE
          }
        }
      });
    } catch (error) {
      console.error('Endorsement leaderboard error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching leaderboard.' });
    }
  },

  /**
   * GET /api/endorsements/status?userId=...
   * Returns which topics the current user has endorsed the target user for.
   */
  status: async (req, res) => {
    try {
      const idResult = normalizeInteger(req.query.userId, 'User ID', 1);
      if (idResult.error) {
        return res.status(400).json({ success: false, message: idResult.error });
      }
      const endorsedId = idResult.value;

      const endorsements = await Endorsement.findAll({
        where: { endorserId: req.user.id, endorsedId },
        attributes: ['topic']
      });

      const endorsedTopics = endorsements.map((e) => e.topic);

      // Also return per-topic counts for the target user
      const topicCounts = await Endorsement.findAll({
        where: { endorsedId },
        attributes: [
          'topic',
          [require('../models').sequelize.fn('COUNT', require('../models').sequelize.col('id')), 'count']
        ],
        group: ['topic']
      });

      const counts = {};
      ENDORSEMENT_TOPICS.forEach((t) => { counts[t] = 0; });
      topicCounts.forEach((row) => {
        counts[row.topic] = parseInt(row.get('count'), 10);
      });

      return res.status(200).json({
        success: true,
        data: { endorsedTopics, topicCounts: counts }
      });
    } catch (error) {
      console.error('Endorsement status error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching endorsement status.' });
    }
  },

  /**
   * GET /api/endorsements/topics
   * Returns list of valid topics.
   */
  topics: async (_req, res) => {
    return res.status(200).json({
      success: true,
      data: { topics: ENDORSEMENT_TOPICS }
    });
  }
};

module.exports = endorsementController;
