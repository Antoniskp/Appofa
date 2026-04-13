const { Op } = require('sequelize');
const { Endorsement, User, PublicPersonProfile } = require('../models');
const { ENDORSEMENT_TOPICS } = require('../models/Endorsement');
const { normalizeInteger } = require('../utils/validators');
const notificationService = require('../services/notificationService');

const PAGE_SIZE = 20;

const endorsementController = {
  /**
   * POST /api/endorsements
   * Body: { endorsedUserId?, endorsedPersonId?, topic }
   *
   * Exactly one of endorsedUserId or endorsedPersonId must be provided.
   * - endorsedUserId: endorse a real (authenticated) user
   * - endorsedPersonId: endorse an unclaimed/pending public person profile
   */
  create: async (req, res) => {
    try {
      const { endorsedUserId, endorsedPersonId, topic } = req.body;

      if (!topic || !ENDORSEMENT_TOPICS.includes(topic)) {
        return res.status(400).json({
          success: false,
          message: `Invalid topic. Must be one of: ${ENDORSEMENT_TOPICS.join(', ')}`
        });
      }

      if (!endorsedUserId && !endorsedPersonId) {
        return res.status(400).json({ success: false, message: 'Provide either endorsedUserId or endorsedPersonId.' });
      }
      if (endorsedUserId && endorsedPersonId) {
        return res.status(400).json({ success: false, message: 'Provide only one of endorsedUserId or endorsedPersonId.' });
      }

      let endorsedId = null;
      let targetPersonId = null;

      if (endorsedUserId) {
        const idResult = normalizeInteger(endorsedUserId, 'Endorsed user ID', 1);
        if (idResult.error) return res.status(400).json({ success: false, message: idResult.error });
        endorsedId = idResult.value;

        if (endorsedId === req.user.id) {
          return res.status(400).json({ success: false, message: 'You cannot endorse yourself.' });
        }

        const targetUser = await User.findByPk(endorsedId, { attributes: ['id'] });
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });
      } else {
        const idResult = normalizeInteger(endorsedPersonId, 'Person profile ID', 1);
        if (idResult.error) return res.status(400).json({ success: false, message: idResult.error });
        targetPersonId = idResult.value;

        const targetPerson = await PublicPersonProfile.findByPk(targetPersonId, { attributes: ['id', 'claimStatus'] });
        if (!targetPerson) return res.status(404).json({ success: false, message: 'Person profile not found.' });
        if (targetPerson.claimStatus === 'rejected') {
          return res.status(400).json({ success: false, message: 'Cannot endorse a rejected person profile.' });
        }
      }

      const [endorsement, created] = await Endorsement.findOrCreate({
        where: {
          endorserId: req.user.id,
          endorsedId,
          endorsedPersonId: targetPersonId,
          topic
        }
      });

      if (created && endorsedId) {
        notificationService.notifyEndorsement(endorsedId, req.user.id).catch(err => console.error('Notification error:', err));
      }

      return res.status(200).json({
        success: true,
        data: { endorsement: { id: endorsement.id, endorsedId, endorsedPersonId: targetPersonId, topic }, created }
      });
    } catch (error) {
      console.error('Endorsement create error:', error);
      return res.status(500).json({ success: false, message: 'Error creating endorsement.' });
    }
  },

  /**
   * DELETE /api/endorsements
   * Body: { endorsedUserId?, endorsedPersonId?, topic }
   */
  remove: async (req, res) => {
    try {
      const { endorsedUserId, endorsedPersonId, topic } = req.body;

      if (!topic || !ENDORSEMENT_TOPICS.includes(topic)) {
        return res.status(400).json({
          success: false,
          message: `Invalid topic. Must be one of: ${ENDORSEMENT_TOPICS.join(', ')}`
        });
      }

      if (!endorsedUserId && !endorsedPersonId) {
        return res.status(400).json({ success: false, message: 'Provide either endorsedUserId or endorsedPersonId.' });
      }

      let endorsedId = null;
      let targetPersonId = null;

      if (endorsedUserId) {
        const idResult = normalizeInteger(endorsedUserId, 'Endorsed user ID', 1);
        if (idResult.error) return res.status(400).json({ success: false, message: idResult.error });
        endorsedId = idResult.value;
      } else {
        const idResult = normalizeInteger(endorsedPersonId, 'Person profile ID', 1);
        if (idResult.error) return res.status(400).json({ success: false, message: idResult.error });
        targetPersonId = idResult.value;
      }

      const deleted = await Endorsement.destroy({
        where: {
          endorserId: req.user.id,
          endorsedId,
          endorsedPersonId: targetPersonId,
          topic
        }
      });

      return res.status(200).json({ success: true, data: { removed: deleted > 0 } });
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
      const { sequelize } = require('../models');

      // Aggregate endorsement counts per user (user-endorsed only)
      const results = await Endorsement.findAll({
        where: { ...whereClause, endorsedId: { [Op.ne]: null } },
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

      const totalCount = await Endorsement.count({
        where: { ...whereClause, endorsedId: { [Op.ne]: null } },
        distinct: true,
        col: 'endorsedId',
        include: [{ model: User, as: 'endorsed', where: { searchable: true } }]
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
   * GET /api/endorsements/status?userId=...&personId=...
   * Returns which topics the current user has endorsed the target user/person for.
   */
  status: async (req, res) => {
    try {
      const { userId, personId } = req.query;

      if (!userId && !personId) {
        return res.status(400).json({ success: false, message: 'Provide either userId or personId.' });
      }

      let endorsedId = null;
      let targetPersonId = null;

      if (userId) {
        const idResult = normalizeInteger(userId, 'User ID', 1);
        if (idResult.error) return res.status(400).json({ success: false, message: idResult.error });
        endorsedId = idResult.value;
      } else {
        const idResult = normalizeInteger(personId, 'Person ID', 1);
        if (idResult.error) return res.status(400).json({ success: false, message: idResult.error });
        targetPersonId = idResult.value;
      }

      const whereForMine = { endorserId: req.user.id };
      const whereForCounts = {};

      if (endorsedId !== null) {
        whereForMine.endorsedId = endorsedId;
        whereForMine.endorsedPersonId = null;
        whereForCounts.endorsedId = endorsedId;
      } else {
        whereForMine.endorsedPersonId = targetPersonId;
        whereForMine.endorsedId = null;
        whereForCounts.endorsedPersonId = targetPersonId;
      }

      const endorsements = await Endorsement.findAll({ where: whereForMine, attributes: ['topic'] });
      const endorsedTopics = endorsements.map((e) => e.topic);

      const { sequelize } = require('../models');
      const topicCounts = await Endorsement.findAll({
        where: whereForCounts,
        attributes: ['topic', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['topic']
      });

      const counts = {};
      ENDORSEMENT_TOPICS.forEach((t) => { counts[t] = 0; });
      topicCounts.forEach((row) => { counts[row.topic] = parseInt(row.get('count'), 10); });

      return res.status(200).json({ success: true, data: { endorsedTopics, topicCounts: counts } });
    } catch (error) {
      console.error('Endorsement status error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching endorsement status.' });
    }
  },

  /**
   * GET /api/endorsements/topics
   * Returns list of valid topics.
   */
  topics: (_req, res) => {
    return res.status(200).json({ success: true, data: { topics: ENDORSEMENT_TOPICS } });
  }
};

module.exports = endorsementController;
