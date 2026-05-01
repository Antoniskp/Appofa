'use strict';

const path = require('path');
const crypto = require('crypto');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
  GovernmentPosition,
  GovernmentCurrentHolder,
  GovernmentPositionSuggestion,
  DreamTeamVote,
  User,
  Location,
  Formation,
  FormationPick,
  FormationLike,
} = require('../models');
const badgeService = require('../services/badgeService');
const { allCountries } = require(path.join(__dirname, '../../config/countries/index.js'));
const { resolveUserDreamTeamCountryCode } = require('../utils/userCountryCode');

// National position slugs that are managed from the Location (Greece) page.
// Editing holders for these positions via Dream Team admin is blocked.
const NATIONAL_POSITION_SLUGS = new Set(['proedros-dimokratias', 'prothypoyrgos', 'proedros-voulis']);

/**
 * Generate a unique shareSlug for a Formation row.
 * Tries up to 5 random 8-byte hex candidates; falls back to 16 bytes on collisions.
 */
async function generateShareSlug() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = crypto.randomBytes(8).toString('hex');
    const existing = await Formation.findOne({ where: { shareSlug: candidate }, attributes: ['id'] });
    if (!existing) return candidate;
  }
  return crypto.randomBytes(16).toString('hex');
}

const dreamTeamController = {
  // GET /api/dream-team/positions
  getPositionsWithData: async (req, res) => {
    try {
      const countryCode = (req.query.countryCode || 'GR').toUpperCase();
      const positions = await GovernmentPosition.findAll({
        where: { isActive: true, countryCode },
        order: [['order', 'ASC']],
        include: [
          {
            model: GovernmentCurrentHolder,
            as: 'currentHolders',
            where: { isActive: true },
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'photo', 'avatarColor'],
                required: false,
              },
            ],
          },
          {
            model: GovernmentPositionSuggestion,
            as: 'aiSuggestions',
            where: { isActive: true },
            required: false,
            order: [['order', 'ASC']],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'photo', 'avatarColor'],
                required: false,
              },
            ],
          },
        ],
      });

      const positionIds = positions.map((p) => p.id);

      // Fetch vote counts per position
      const voteCounts = await DreamTeamVote.findAll({
        attributes: [
          'positionId',
          'candidateUserId',
          'personName',
          [sequelize.fn('COUNT', sequelize.col('id')), 'voteCount'],
        ],
        where: { positionId: { [Op.in]: positionIds } },
        group: ['positionId', 'candidateUserId', 'personName'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        raw: true,
      });

      // Enrich vote counts with User data
      const votedUserIds = [...new Set(voteCounts.map((v) => v.candidateUserId).filter(Boolean))];
      if (votedUserIds.length > 0) {
        const votedUsers = await User.findAll({
          where: { id: { [Op.in]: votedUserIds } },
          attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'photo', 'avatarColor'],
          raw: true,
        });
        const userMap = {};
        votedUsers.forEach((u) => { userMap[u.id] = u; });
        voteCounts.forEach((v) => { v.candidateUser = userMap[v.candidateUserId] || null; });
      }

      // Fetch current user's votes
      let myVotes = [];
      if (req.user) {
        myVotes = await DreamTeamVote.findAll({
          where: {
            userId: req.user.id,
            positionId: { [Op.in]: positionIds },
          },
          raw: true,
        });
      }

      // Build lookup maps
      const votesByPosition = {};
      voteCounts.forEach((v) => {
        if (!votesByPosition[v.positionId]) votesByPosition[v.positionId] = [];
        votesByPosition[v.positionId].push(v);
      });

      const myVoteByPosition = {};
      myVotes.forEach((v) => {
        myVoteByPosition[v.positionId] = v;
      });

      const data = positions.map((position) => {
        const posJson = position.toJSON();
        posJson.currentHolders = (posJson.currentHolders || []).map((holder) => ({
          ...holder,
          holderPhoto: holder.user ? (holder.user.photo || holder.user.avatar || null) : null,
          holderAvatarColor: holder.user?.avatarColor || null,
        }));
        return {
          ...posJson,
          votes: votesByPosition[position.id] || [],
          myVote: myVoteByPosition[position.id] || null,
        };
      });

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('dreamTeamController.getPositionsWithData error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // POST /api/dream-team/vote
  vote: async (req, res) => {
    try {
      const { positionId, candidateUserId } = req.body;

      if (!positionId || !candidateUserId) {
        return res.status(400).json({
          success: false,
          message: 'Απαιτούνται positionId και candidateUserId.',
        });
      }

      const position = await GovernmentPosition.findOne({
        where: { id: positionId, isActive: true },
      });
      if (!position) {
        return res.status(404).json({
          success: false,
          message: 'Η θέση δεν βρέθηκε.',
        });
      }

      const voter = await User.findByPk(req.user.id, {
        attributes: ['id', 'nationality', 'homeLocationId'],
        include: [
          {
            model: Location,
            as: 'homeLocation',
            attributes: ['id', 'type', 'code'],
            required: false,
            include: [
              {
                model: Location,
                as: 'parent',
                attributes: ['id', 'type', 'code'],
                required: false,
                include: [
                  {
                    model: Location,
                    as: 'parent',
                    attributes: ['id', 'type', 'code'],
                    required: false,
                    include: [
                      {
                        model: Location,
                        as: 'parent',
                        attributes: ['id', 'type', 'code'],
                        required: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
      if (!voter) {
        return res.status(404).json({
          success: false,
          message: 'Ο χρήστης δεν βρέθηκε.',
        });
      }

      const voterCountryCode = resolveUserDreamTeamCountryCode(voter.toJSON());
      if (voterCountryCode && voterCountryCode !== position.countryCode) {
        return res.status(403).json({
          success: false,
          message: 'Μπορείτε να ψηφίσετε μόνο στη δική σας χώρα.',
        });
      }

      const candidateUser = await User.findByPk(candidateUserId, {
        attributes: ['id', 'username', 'firstNameNative', 'lastNameNative'],
      });
      if (!candidateUser) {
        return res.status(404).json({
          success: false,
          message: 'Ο χρήστης δεν βρέθηκε.',
        });
      }
      const personName = (`${candidateUser.firstNameNative || ''} ${candidateUser.lastNameNative || ''}`.trim()) || candidateUser.username;

      // Check if the same person is already voted for in a different position
      const duplicateVote = await DreamTeamVote.findOne({
        where: {
          userId: req.user.id,
          candidateUserId,
          positionId: { [Op.ne]: positionId },
        },
        include: [{ model: GovernmentPosition, as: 'position', attributes: ['title'] }],
      });
      if (duplicateVote) {
        return res.status(400).json({
          success: false,
          message: `Αυτό το πρόσωπο έχει ήδη επιλεγεί σε άλλη θέση${duplicateVote.position?.title ? ` (${duplicateVote.position.title})` : ''}. Αφαιρέστε το πρώτα από εκείνη τη θέση.`,
        });
      }

      const existing = await DreamTeamVote.findOne({
        where: { userId: req.user.id, positionId },
      });

      if (existing) {
        await existing.update({ candidateUserId, personName });
      } else {
        await DreamTeamVote.create({
          userId: req.user.id,
          positionId,
          candidateUserId,
          personName,
        });
      }

      return res.status(200).json({
        success: true,
        data: { positionId, candidateUserId, personName },
        message: 'Ψήφος καταγράφηκε επιτυχώς.',
      });
    } catch (error) {
      console.error('dreamTeamController.vote error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // GET /api/dream-team/results
  getResults: async (req, res) => {
    try {
      const countryCode = (req.query.countryCode || 'GR').toUpperCase();
      const positions = await GovernmentPosition.findAll({
        where: { isActive: true, countryCode },
        order: [['order', 'ASC']],
        include: [
          {
            model: GovernmentCurrentHolder,
            as: 'currentHolders',
            where: { isActive: true },
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'photo'],
                required: false,
              },
            ],
          },
          {
            model: GovernmentPositionSuggestion,
            as: 'aiSuggestions',
            where: { isActive: true },
            required: false,
            order: [['order', 'ASC']],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'photo'],
                required: false,
              },
            ],
          },
        ],
      });

      const positionIds = positions.map((p) => p.id);

      // Step 1: aggregate WITHOUT include to avoid GROUP BY conflict in PostgreSQL
      const voteCounts = await DreamTeamVote.findAll({
        attributes: [
          'positionId',
          'candidateUserId',
          'personName',
          [sequelize.fn('COUNT', sequelize.col('DreamTeamVote.id')), 'voteCount'],
        ],
        where: { positionId: { [Op.in]: positionIds } },
        group: ['positionId', 'candidateUserId', 'personName'],
        order: [[sequelize.fn('COUNT', sequelize.col('DreamTeamVote.id')), 'DESC']],
        raw: true,
      });

      // Step 2: determine winner per position and collect their candidateUserIds
      const winnerByPosition = {};
      voteCounts.forEach((v) => {
        if (!winnerByPosition[v.positionId]) {
          winnerByPosition[v.positionId] = v;
        }
      });

      const winnerUserIds = [...new Set(
        Object.values(winnerByPosition).map((v) => v.candidateUserId).filter(Boolean)
      )];

      // Step 3: fetch photos for User-based winners (avatar or photo for person profiles)
      const userAvatars = {};
      if (winnerUserIds.length > 0) {
        const users = await User.findAll({
          where: { id: { [Op.in]: winnerUserIds } },
          attributes: ['id', 'avatar', 'photo'],
          raw: true,
        });
        users.forEach((u) => { userAvatars[u.id] = u.photo || u.avatar; });
      }

      // Total votes per position
      const totalByPosition = {};
      voteCounts.forEach((v) => {
        totalByPosition[v.positionId] = (totalByPosition[v.positionId] || 0) + parseInt(v.voteCount, 10);
      });

      const dreamTeam = positions.map((position) => {
        const winner = winnerByPosition[position.id];
        const total = totalByPosition[position.id] || 0;
        const posJson = position.toJSON();
        posJson.currentHolders = (posJson.currentHolders || []).map((holder) => ({
          ...holder,
          holderPhoto: holder.user ? (holder.user.photo || holder.user.avatar || null) : null,
        }));
        return {
          position: posJson,
          winner: winner
            ? {
                candidateUserId: winner.candidateUserId,
                personName: winner.personName,
                avatar: userAvatars[winner.candidateUserId] || null,
                voteCount: parseInt(winner.voteCount, 10),
                percentage: total > 0
                  ? Math.round((parseInt(winner.voteCount, 10) / total) * 100)
                  : 0,
              }
            : null,
        };
      });

      return res.status(200).json({ success: true, data: dreamTeam });
    } catch (error) {
      console.error('dreamTeamController.getResults error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // GET /api/dream-team/my-votes
  getMyVotes: async (req, res) => {
    try {
      const votes = await DreamTeamVote.findAll({
        where: { userId: req.user.id },
        include: [
          {
            model: GovernmentPosition,
            as: 'position',
            attributes: ['id', 'slug', 'title', 'positionTypeKey', 'scope'],
          },
          {
            model: User,
            as: 'candidateUser',
            attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'photo'],
            required: false,
          },
        ],
      });

      return res.status(200).json({ success: true, data: votes });
    } catch (error) {
      console.error('dreamTeamController.getMyVotes error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // DELETE /api/dream-team/vote/:positionId
  deleteVote: async (req, res) => {
    try {
      const positionId = parseInt(req.params.positionId, 10);
      if (isNaN(positionId) || positionId <= 0) {
        return res.status(400).json({ success: false, message: 'Απαιτείται positionId.' });
      }
      const deleted = await DreamTeamVote.destroy({
        where: { userId: req.user.id, positionId },
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Ψήφος δεν βρέθηκε.' });
      }
      return res.status(200).json({ success: true, message: 'Ψήφος διαγράφηκε.' });
    } catch (error) {
      console.error('dreamTeamController.deleteVote error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // ─── Admin: positions overview ───────────────────────────────────────────────

  // GET /api/admin/dream-team/positions
  // Optional query param: countryCode (e.g. "GR", "CY") to filter by country.
  adminGetPositions: async (req, res) => {
    try {
      const where = req.query.countryCode
        ? { countryCode: req.query.countryCode.toUpperCase() }
        : {};
      const positions = await GovernmentPosition.findAll({
        where,
        order: [['order', 'ASC']],
        include: [
          {
            model: GovernmentCurrentHolder,
            as: 'currentHolders',
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'photo'],
                required: false,
              },
            ],
          },
          {
            model: GovernmentPositionSuggestion,
            as: 'aiSuggestions',
            required: false,
            order: [['order', 'ASC']],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'photo'],
                required: false,
              },
            ],
          },
        ],
      });
      return res.status(200).json({ success: true, data: positions });
    } catch (error) {
      console.error('dreamTeamController.adminGetPositions error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // ─── Admin: suggestions CRUD ─────────────────────────────────────────────────

  // POST /api/admin/dream-team/suggestions
  adminCreateSuggestion: async (req, res) => {
    try {
      const { positionId, userId, reason, order: ord } = req.body;
      if (!positionId || !userId) {
        return res.status(400).json({ success: false, message: 'Απαιτείται userId (verified app user).' });
      }
      const position = await GovernmentPosition.findByPk(positionId);
      if (!position) {
        return res.status(404).json({ success: false, message: 'Η θέση δεν βρέθηκε.' });
      }
      const user = await User.findByPk(userId, { attributes: ['id', 'isVerified', 'searchable', 'claimStatus'] });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Ο χρήστης δεν βρέθηκε.' });
      }
      if ((!user.isVerified && user.claimStatus === null) || !user.searchable) {
        return res.status(400).json({ success: false, message: 'Μόνο επαληθευμένοι χρήστες με δημόσιο προφίλ μπορούν να προστεθούν.' });
      }
      const suggestion = await GovernmentPositionSuggestion.create({
        positionId,
        userId,
        reason: reason?.trim() || null,
        order: ord ?? 0,
        isActive: true,
      });
      const suggestionWithUser = await GovernmentPositionSuggestion.findByPk(suggestion.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'photo'], required: false },
        ],
      });
      return res.status(201).json({ success: true, data: suggestionWithUser });
    } catch (error) {
      console.error('dreamTeamController.adminCreateSuggestion error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // PUT /api/admin/dream-team/suggestions/:id
  adminUpdateSuggestion: async (req, res) => {
    try {
      const suggestion = await GovernmentPositionSuggestion.findByPk(req.params.id);
      if (!suggestion) {
        return res.status(404).json({ success: false, message: 'Η πρόταση δεν βρέθηκε.' });
      }
      const { userId, reason, order: ord, isActive } = req.body;
      if (userId !== undefined && userId !== null) {
        const user = await User.findByPk(userId, { attributes: ['id', 'isVerified', 'searchable', 'claimStatus'] });
        if (!user) {
          return res.status(404).json({ success: false, message: 'Ο χρήστης δεν βρέθηκε.' });
        }
        if ((!user.isVerified && user.claimStatus === null) || !user.searchable) {
          return res.status(400).json({ success: false, message: 'Μόνο επαληθευμένοι χρήστες με δημόσιο προφίλ μπορούν να προστεθούν.' });
        }
      }
      await suggestion.update({
        ...(userId !== undefined && { userId: userId || null }),
        ...(reason !== undefined && { reason: reason?.trim() || null }),
        ...(ord !== undefined && { order: ord }),
        ...(isActive !== undefined && { isActive }),
      });
      const updated = await GovernmentPositionSuggestion.findByPk(suggestion.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'photo'], required: false },
        ],
      });
      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('dreamTeamController.adminUpdateSuggestion error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // DELETE /api/admin/dream-team/suggestions/:id
  adminDeleteSuggestion: async (req, res) => {
    try {
      const suggestion = await GovernmentPositionSuggestion.findByPk(req.params.id);
      if (!suggestion) {
        return res.status(404).json({ success: false, message: 'Η πρόταση δεν βρέθηκε.' });
      }
      await suggestion.destroy();
      return res.status(200).json({ success: true, message: 'Η πρόταση διαγράφηκε.' });
    } catch (error) {
      console.error('dreamTeamController.adminDeleteSuggestion error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // ─── Admin: current holders CRUD ─────────────────────────────────────────────

  // POST /api/admin/dream-team/holders
  adminCreateHolder: async (req, res) => {
    try {
      const { positionId, userId, since, notes } = req.body;
      if (!positionId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Απαιτείται userId (verified app user).',
        });
      }
      const position = await GovernmentPosition.findByPk(positionId);
      if (!position) {
        return res.status(404).json({ success: false, message: 'Η θέση δεν βρέθηκε.' });
      }
      if (NATIONAL_POSITION_SLUGS.has(position.slug)) {
        return res.status(400).json({
          success: false,
          message: 'Οι εθνικές θέσεις διαχειρίζονται από τη σελίδα Τοποθεσίας (Ελλάδα).',
        });
      }
      const user = await User.findByPk(userId, { attributes: ['id', 'isVerified', 'searchable', 'claimStatus'] });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Ο χρήστης δεν βρέθηκε.' });
      }
      if ((!user.isVerified && user.claimStatus === null) || !user.searchable) {
        return res.status(400).json({ success: false, message: 'Μόνο επαληθευμένοι χρήστες με δημόσιο προφίλ μπορούν να προστεθούν.' });
      }

      // Delete any existing holders for this position (stale data should not be kept)
      await GovernmentCurrentHolder.destroy({ where: { positionId } });

      const holder = await GovernmentCurrentHolder.create({
        positionId,
        userId,
        since: since || null,
        notes: notes?.trim() || null,
        isActive: true,
      });

      const holderWithUser = await GovernmentCurrentHolder.findByPk(holder.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'photo'], required: false },
        ],
      });

      return res.status(201).json({ success: true, data: holderWithUser });
    } catch (error) {
      console.error('dreamTeamController.adminCreateHolder error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // PUT /api/admin/dream-team/holders/:id
  adminUpdateHolder: async (req, res) => {
    try {
      const holder = await GovernmentCurrentHolder.findByPk(req.params.id);
      if (!holder) {
        return res.status(404).json({ success: false, message: 'Ο κάτοχος δεν βρέθηκε.' });
      }
      const position = await GovernmentPosition.findByPk(holder.positionId, { attributes: ['slug'] });
      if (position && NATIONAL_POSITION_SLUGS.has(position.slug)) {
        return res.status(400).json({
          success: false,
          message: 'Οι εθνικές θέσεις διαχειρίζονται από τη σελίδα Τοποθεσίας (Ελλάδα).',
        });
      }
      const { userId, since, notes, isActive } = req.body;
      if (userId !== undefined && userId !== null) {
        const user = await User.findByPk(userId, { attributes: ['id', 'isVerified', 'searchable', 'claimStatus'] });
        if (!user) {
          return res.status(404).json({ success: false, message: 'Ο χρήστης δεν βρέθηκε.' });
        }
        if ((!user.isVerified && user.claimStatus === null) || !user.searchable) {
          return res.status(400).json({ success: false, message: 'Μόνο επαληθευμένοι χρήστες με δημόσιο προφίλ μπορούν να προστεθούν.' });
        }
      }
      await holder.update({
        ...(userId !== undefined && { userId: userId || null }),
        ...(since !== undefined && { since: since || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      });
      const updated = await GovernmentCurrentHolder.findByPk(holder.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'photo'], required: false },
        ],
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('dreamTeamController.adminUpdateHolder error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // DELETE /api/admin/dream-team/holders/:id
  adminDeleteHolder: async (req, res) => {
    try {
      const holder = await GovernmentCurrentHolder.findByPk(req.params.id);
      if (!holder) {
        return res.status(404).json({ success: false, message: 'Ο κάτοχος δεν βρέθηκε.' });
      }
      const position = await GovernmentPosition.findByPk(holder.positionId, { attributes: ['slug'] });
      if (position && NATIONAL_POSITION_SLUGS.has(position.slug)) {
        return res.status(400).json({
          success: false,
          message: 'Οι εθνικές θέσεις διαχειρίζονται από τη σελίδα Τοποθεσίας (Ελλάδα).',
        });
      }
      await holder.destroy();

      return res.status(200).json({ success: true, message: 'Ο κάτοχος διαγράφηκε.' });
    } catch (error) {
      console.error('dreamTeamController.adminDeleteHolder error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // ── Formations ──────────────────────────────────────────────────────────────

  // Helper to serialise a formation for the API response
  _serializeFormation: async (formation, requestUserId) => {
    const picks = (formation.picks || []).map((p) => ({
      positionSlug: p.positionSlug,
      candidateUserId: p.candidateUserId,
      personName: p.personName,
      photo: p.photo,
      avatar: p.avatar,
    }));

    let likedByMe = false;
    if (requestUserId) {
      likedByMe = !!(await FormationLike.findOne({
        where: { formationId: formation.id, userId: requestUserId },
      }));
    }

    // Lazy backfill: if this formation has no shareSlug, generate and persist one now.
    // If two concurrent requests race on the same formation both will generate distinct
    // valid slugs; the WHERE condition ensures only the first writer wins.
    let { shareSlug } = formation;
    if (!shareSlug) {
      shareSlug = await generateShareSlug();
      if (shareSlug) {
        try {
          await Formation.update({ shareSlug }, { where: { id: formation.id, shareSlug: null } });
        } catch (backfillErr) {
          // Another concurrent request may have already persisted a slug — that's fine.
          console.warn(`dreamTeamController._serializeFormation: backfill shareSlug failed for formation ${formation.id}:`, String(backfillErr));
        }
      }
    }

    return {
      id: formation.id,
      name: formation.name,
      description: formation.description,
      category: formation.category,
      isPublic: formation.isPublic,
      shareSlug,
      likeCount: formation.likeCount,
      likedByMe,
      authorName: formation.author
        ? (`${formation.author.firstNameNative || ''} ${formation.author.lastNameNative || ''}`.trim() || formation.author.username)
        : null,
      authorAvatar: formation.author?.avatar || null,
      picks,
      createdAt: formation.createdAt,
      updatedAt: formation.updatedAt,
    };
  },

  // GET /api/dream-team/formations
  getMyFormations: async (req, res) => {
    try {
      const userId = req.user.id;
      const formations = await Formation.findAll({
        where: { userId },
        include: [
          { model: FormationPick, as: 'picks' },
          { model: User, as: 'author', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar'] },
        ],
        order: [['updatedAt', 'DESC']],
      });

      const data = await Promise.all(
        formations.map((f) => dreamTeamController._serializeFormation(f, userId)),
      );
      return res.json({ success: true, data });
    } catch (error) {
      console.error('dreamTeamController.getMyFormations error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // POST /api/dream-team/formations
  createFormation: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, description, category, isPublic } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Το όνομα είναι υποχρεωτικό.' });
      }
      if (category && !['serious', 'fun', 'custom'].includes(category)) {
        return res.status(400).json({ success: false, message: 'Μη έγκυρη κατηγορία.' });
      }

      const shareSlug = await generateShareSlug();

      const formation = await Formation.create({
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        category: category || 'serious',
        isPublic: !!isPublic,
        shareSlug,
        likeCount: 0,
      });

      const full = await Formation.findByPk(formation.id, {
        include: [
          { model: FormationPick, as: 'picks' },
          { model: User, as: 'author', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar'] },
        ],
      });

      const data = await dreamTeamController._serializeFormation(full, userId);
      badgeService.evaluate(userId).catch(err => console.error('Badge evaluation error:', err));
      return res.status(201).json({ success: true, data });
    } catch (error) {
      console.error('dreamTeamController.createFormation error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // GET /api/dream-team/formations/:id
  getFormation: async (req, res) => {
    try {
      const requestUserId = req.user?.id;
      const formation = await Formation.findByPk(req.params.id, {
        include: [
          { model: FormationPick, as: 'picks' },
          { model: User, as: 'author', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar'] },
        ],
      });

      if (!formation) {
        return res.status(404).json({ success: false, message: 'Η σύνθεση δεν βρέθηκε.' });
      }
      if (!formation.isPublic && formation.userId !== requestUserId) {
        return res.status(403).json({ success: false, message: 'Δεν έχετε πρόσβαση σε αυτή τη σύνθεση.' });
      }

      const data = await dreamTeamController._serializeFormation(formation, requestUserId);
      return res.json({ success: true, data });
    } catch (error) {
      console.error('dreamTeamController.getFormation error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // PUT /api/dream-team/formations/:id
  updateFormation: async (req, res) => {
    try {
      const userId = req.user.id;
      const formation = await Formation.findByPk(req.params.id);

      if (!formation) {
        return res.status(404).json({ success: false, message: 'Η σύνθεση δεν βρέθηκε.' });
      }
      if (formation.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Δεν έχετε δικαίωμα επεξεργασίας.' });
      }

      const { name, description, category, isPublic } = req.body;

      if (name !== undefined && !name.trim()) {
        return res.status(400).json({ success: false, message: 'Το όνομα δεν μπορεί να είναι κενό.' });
      }
      if (category !== undefined && !['serious', 'fun', 'custom'].includes(category)) {
        return res.status(400).json({ success: false, message: 'Μη έγκυρη κατηγορία.' });
      }

      await formation.update({
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(category !== undefined && { category }),
        ...(isPublic !== undefined && { isPublic: !!isPublic }),
      });

      const full = await Formation.findByPk(formation.id, {
        include: [
          { model: FormationPick, as: 'picks' },
          { model: User, as: 'author', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar'] },
        ],
      });

      const data = await dreamTeamController._serializeFormation(full, userId);
      return res.json({ success: true, data });
    } catch (error) {
      console.error('dreamTeamController.updateFormation error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // DELETE /api/dream-team/formations/:id
  deleteFormation: async (req, res) => {
    try {
      const userId = req.user.id;
      const formation = await Formation.findByPk(req.params.id);

      if (!formation) {
        return res.status(404).json({ success: false, message: 'Η σύνθεση δεν βρέθηκε.' });
      }
      if (formation.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Δεν έχετε δικαίωμα διαγραφής.' });
      }

      await formation.destroy();
      return res.json({ success: true, message: 'Η σύνθεση διαγράφηκε.' });
    } catch (error) {
      console.error('dreamTeamController.deleteFormation error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // POST /api/dream-team/formations/:id/picks
  updateFormationPicks: async (req, res) => {
    try {
      const userId = req.user.id;
      const formation = await Formation.findByPk(req.params.id);

      if (!formation) {
        return res.status(404).json({ success: false, message: 'Η σύνθεση δεν βρέθηκε.' });
      }
      if (formation.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Δεν έχετε δικαίωμα επεξεργασίας.' });
      }

      const { picks } = req.body;
      if (!Array.isArray(picks)) {
        return res.status(400).json({ success: false, message: 'Το πεδίο picks πρέπει να είναι πίνακας.' });
      }

      const validPicks = picks.filter(
        (p) => p.positionSlug && (p.personName || p.candidateUserId),
      );

      // Check for duplicate candidateUserId across picks
      const pickedCandidateUserIds = validPicks.map((p) => p.candidateUserId).filter((id) => id != null);
      if (
        new Set(pickedCandidateUserIds).size < pickedCandidateUserIds.length
      ) {
        return res.status(400).json({
          success: false,
          message: 'Το ίδιο πρόσωπο δεν μπορεί να τοποθετηθεί σε πολλαπλές θέσεις.',
        });
      }

      // Replace all picks for this formation
      await FormationPick.destroy({ where: { formationId: formation.id } });

      if (validPicks.length > 0) {
        await FormationPick.bulkCreate(
          validPicks.map((p) => ({
            formationId: formation.id,
            positionSlug: p.positionSlug,
            candidateUserId: p.candidateUserId || null,
            personName: p.personName || null,
            photo: p.photo || null,
            avatar: p.avatar || null,
          })),
        );
      }

      // Touch updatedAt
      await formation.update({ updatedAt: new Date() });

      const full = await Formation.findByPk(formation.id, {
        include: [
          { model: FormationPick, as: 'picks' },
          { model: User, as: 'author', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar'] },
        ],
      });

      const data = await dreamTeamController._serializeFormation(full, userId);
      return res.json({ success: true, data });
    } catch (error) {
      console.error('dreamTeamController.updateFormationPicks error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // GET /api/dream-team/formations/public
  getPublicFormations: async (req, res) => {
    try {
      const requestUserId = req.user?.id;
      const { category, sort = 'popular', page = 1, limit = 12 } = req.query;

      const where = { isPublic: true };
      if (category && ['serious', 'fun', 'custom'].includes(category)) {
        where.category = category;
      }

      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      // For 'completed' sort, compute pick count at database level via a subquery
      let order;
      let attributes = undefined;
      if (sort === 'completed') {
        const pickCountSubquery = `(
          SELECT COUNT(*) FROM "FormationPicks" AS fp
          WHERE fp."formationId" = "Formation"."id"
            AND (fp."personName" IS NOT NULL OR fp."candidateUserId" IS NOT NULL)
        )`;
        attributes = {
          include: [[sequelize.literal(pickCountSubquery), 'filledCount']],
        };
        order = [[sequelize.literal('"filledCount"'), 'DESC'], ['createdAt', 'DESC']];
      } else if (sort === 'newest') {
        order = [['createdAt', 'DESC']];
      } else {
        // popular (default)
        order = [['likeCount', 'DESC'], ['createdAt', 'DESC']];
      }

      const { count, rows } = await Formation.findAndCountAll({
        where,
        attributes,
        include: [
          { model: FormationPick, as: 'picks' },
          { model: User, as: 'author', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar'] },
        ],
        order,
        limit: parseInt(limit, 10),
        offset,
        distinct: true,
        subQuery: false,
      });

      const data = await Promise.all(
        rows.map((f) => dreamTeamController._serializeFormation(f, requestUserId)),
      );

      return res.json({
        success: true,
        data,
        pagination: {
          total: count,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(count / parseInt(limit, 10)),
        },
      });
    } catch (error) {
      console.error('dreamTeamController.getPublicFormations error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // POST /api/dream-team/formations/:id/like
  likeFormation: async (req, res) => {
    try {
      const userId = req.user.id;
      const formation = await Formation.findByPk(req.params.id);

      if (!formation) {
        return res.status(404).json({ success: false, message: 'Η σύνθεση δεν βρέθηκε.' });
      }
      if (!formation.isPublic && formation.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Δεν έχετε πρόσβαση σε αυτή τη σύνθεση.' });
      }

      const existing = await FormationLike.findOne({
        where: { formationId: formation.id, userId },
      });

      let likedByMe;
      if (existing) {
        await existing.destroy();
        await formation.decrement('likeCount');
        likedByMe = false;
      } else {
        await FormationLike.create({ formationId: formation.id, userId });
        await formation.increment('likeCount');
        likedByMe = true;
      }

      await formation.reload();
      return res.json({ success: true, data: { likedByMe, likeCount: formation.likeCount } });
    } catch (error) {
      console.error('dreamTeamController.likeFormation error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // GET /api/dream-team/formations/share/:slug
  getSharedFormation: async (req, res) => {
    try {
      const requestUserId = req.user?.id;
      const formation = await Formation.findOne({
        where: { shareSlug: req.params.slug },
        include: [
          { model: FormationPick, as: 'picks' },
          { model: User, as: 'author', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar'] },
        ],
      });

      if (!formation) {
        return res.status(404).json({ success: false, message: 'Η σύνθεση δεν βρέθηκε.' });
      }
      if (!formation.isPublic && formation.userId !== requestUserId) {
        return res.status(403).json({ success: false, message: 'Αυτή η σύνθεση είναι ιδιωτική.' });
      }

      const data = await dreamTeamController._serializeFormation(formation, requestUserId);
      return res.json({ success: true, data });
    } catch (error) {
      console.error('dreamTeamController.getSharedFormation error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // GET /api/dream-team/formations/popular-picks
  getPopularPicks: async (req, res) => {
    try {
      const topSlugs = ['prothypoyrgos', 'proedros-dimokratias', 'proedros-voulis'];

      const results = await Promise.all(
        topSlugs.map(async (slug) => {
          const picks = await FormationPick.findAll({
            where: {
              positionSlug: slug,
              [Op.or]: [
                { personName: { [Op.ne]: null } },
                { candidateUserId: { [Op.ne]: null } },
              ],
            },
            include: [
              {
                model: Formation,
                as: 'formation',
                where: { isPublic: true },
                attributes: [],
              },
            ],
            attributes: [
              'personName',
              'candidateUserId',
              'photo',
              'avatar',
              [sequelize.fn('COUNT', sequelize.col('FormationPick.id')), 'count'],
            ],
            group: ['personName', 'candidateUserId', 'photo', 'avatar'],
            order: [[sequelize.literal('"count"'), 'DESC']],
            limit: 1,
            subQuery: false,
          });

          const top = picks[0];
          return {
            positionSlug: slug,
            personName: top?.personName || null,
            candidateUserId: top?.candidateUserId || null,
            photo: top?.photo || null,
            avatar: top?.avatar || null,
            count: top ? parseInt(top.dataValues.count, 10) : 0,
          };
        }),
      );

      return res.json({ success: true, data: results });
    } catch (error) {
      console.error('dreamTeamController.getPopularPicks error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // GET /api/dream-team/formations/formation-of-the-week
  getFormationOfTheWeek: async (req, res) => {
    try {
      const requestUserId = req.user?.id;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const formation = await Formation.findOne({
        where: {
          isPublic: true,
          createdAt: { [Op.gte]: sevenDaysAgo },
          likeCount: { [Op.gt]: 0 },
        },
        include: [
          { model: FormationPick, as: 'picks' },
          { model: User, as: 'author', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar'] },
        ],
        order: [['likeCount', 'DESC'], ['createdAt', 'DESC']],
      });

      if (!formation) {
        return res.json({ success: true, data: null });
      }

      const data = await dreamTeamController._serializeFormation(formation, requestUserId);
      return res.json({ success: true, data });
    } catch (error) {
      console.error('dreamTeamController.getFormationOfTheWeek error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // GET /api/dream-team/formations/leaderboard
  getLeaderboard: async (req, res) => {
    try {
      const requestUserId = req.user?.id;
      const { limit = 10, offset = 0 } = req.query;

      // Aggregate total likes and public formation count per user
      const rows = await Formation.findAll({
        where: { isPublic: true },
        attributes: [
          'userId',
          [sequelize.fn('SUM', sequelize.col('likeCount')), 'totalLikes'],
          [sequelize.fn('COUNT', sequelize.col('Formation.id')), 'publicFormations'],
        ],
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar'] },
        ],
        group: ['userId', 'author.id'],
        order: [[sequelize.literal('"totalLikes"'), 'DESC']],
        limit: parseInt(limit, 10) + 1,
        offset: parseInt(offset, 10),
        subQuery: false,
      });

      const hasMore = rows.length > parseInt(limit, 10);
      const leaderboard = rows.slice(0, parseInt(limit, 10)).map((row, idx) => ({
        rank: parseInt(offset, 10) + idx + 1,
        userId: row.userId,
        username: row.author
          ? (`${row.author.firstNameNative || ''} ${row.author.lastNameNative || ''}`.trim() || row.author.username)
          : 'Άγνωστος',
        avatar: row.author?.avatar || null,
        totalLikes: parseInt(row.dataValues.totalLikes, 10) || 0,
        publicFormations: parseInt(row.dataValues.publicFormations, 10) || 0,
        isCurrentUser: row.userId === requestUserId,
      }));

      // If user is logged in and not in top list, find their rank
      let currentUserRank = null;
      if (requestUserId && !leaderboard.some((r) => r.isCurrentUser)) {
        const allRanked = await Formation.findAll({
          where: { isPublic: true },
          attributes: [
            'userId',
            [sequelize.fn('SUM', sequelize.col('likeCount')), 'totalLikes'],
          ],
          group: ['userId'],
          order: [[sequelize.literal('"totalLikes"'), 'DESC']],
          subQuery: false,
        });
        const userIdx = allRanked.findIndex((r) => r.userId === requestUserId);
        if (userIdx >= 0) {
          const userRow = allRanked[userIdx];
          currentUserRank = {
            rank: userIdx + 1,
            totalLikes: parseInt(userRow.dataValues.totalLikes, 10) || 0,
          };
        }
      }

      return res.json({ success: true, data: leaderboard, hasMore, currentUserRank });
    } catch (error) {
      console.error('dreamTeamController.getLeaderboard error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // GET /api/dream-team/formations/my-stats
  getMyStats: async (req, res) => {
    try {
      const userId = req.user.id;

      const formations = await Formation.findAll({
        where: { userId },
        include: [{ model: FormationPick, as: 'picks' }],
        attributes: ['id', 'isPublic', 'shareSlug', 'likeCount'],
      });

      const formationCount = formations.length;
      const totalLikes = formations.reduce((sum, f) => sum + (f.likeCount || 0), 0);
      const hasFullCabinet = formations.some((f) => {
        const filledPicks = (f.picks || []).filter(
          (p) => p.candidateUserId || p.personName,
        );
        return filledPicks.length >= 22;
      });
      const hasPublicFormation = formations.some((f) => f.isPublic);
      const hasShared = formations.some((f) => f.shareSlug);

      // Rank: count users with more total likes
      const allUsers = await Formation.findAll({
        where: { isPublic: true },
        attributes: ['userId', [sequelize.fn('SUM', sequelize.col('likeCount')), 'totalLikes']],
        group: ['userId'],
        order: [[sequelize.literal('"totalLikes"'), 'DESC']],
        subQuery: false,
      });
      const rankIndex = allUsers.findIndex((r) => r.userId === userId);
      const rank = rankIndex >= 0 ? rankIndex + 1 : null;

      const avgCompletion = formationCount === 0 ? 0 : Math.round(
        formations.reduce((sum, f) => {
          const filled = (f.picks || []).filter((p) => p.candidateUserId || p.personName).length;
          return sum + (filled / 22) * 100;
        }, 0) / formationCount,
      );

      return res.json({
        success: true,
        data: {
          formationCount,
          totalLikes,
          hasFullCabinet,
          hasPublicFormation,
          hasShared,
          rank,
          avgCompletion,
        },
      });
    } catch (error) {
      console.error('dreamTeamController.getMyStats error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // GET /api/dream-team/formations/activity
  getActivityFeed: async (req, res) => {
    try {
      const { limit = 15 } = req.query;

      // Recent public formations created
      const recentFormations = await Formation.findAll({
        where: { isPublic: true },
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit, 10),
        attributes: ['id', 'name', 'shareSlug', 'likeCount', 'createdAt', 'userId'],
      });

      const activities = recentFormations.map((f) => {
        const authorName = f.author
          ? (`${f.author.firstNameNative || ''} ${f.author.lastNameNative || ''}`.trim() || f.author.username)
          : 'Κάποιος χρήστης';
        const authorAvatar = f.author?.avatar || null;

        return {
          id: `formation-${f.id}`,
          type: 'new_formation',
          emoji: '🏛️',
          authorName,
          authorAvatar,
          formationName: f.name,
          formationSlug: f.shareSlug,
          likeCount: f.likeCount || 0,
          timestamp: f.createdAt,
        };
      });

      return res.json({ success: true, data: activities });
    } catch (error) {
      console.error('dreamTeamController.getActivityFeed error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // GET /api/dream-team/countries
  // Returns the list of countries that have active government position configs.
  getCountries: async (req, res) => {
    try {
      const countries = allCountries.map((c) => ({
        countryCode: c.countryCode,
        positionCount: Array.isArray(c.positions) ? c.positions.length : 0,
      }));
      return res.json({ success: true, data: countries });
    } catch (error) {
      console.error('dreamTeamController.getCountries error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },
};

module.exports = dreamTeamController;
