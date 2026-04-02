'use strict';

const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
  GovernmentPosition,
  GovernmentCurrentHolder,
  GovernmentPositionSuggestion,
  DreamTeamVote,
  PublicPersonProfile,
  User,
} = require('../models');

const dreamTeamController = {
  // GET /api/dream-team/positions
  getPositionsWithData: async (req, res) => {
    try {
      const positions = await GovernmentPosition.findAll({
        where: { isActive: true },
        order: [['order', 'ASC']],
        include: [
          {
            model: GovernmentCurrentHolder,
            as: 'currentHolders',
            where: { isActive: true },
            required: false,
            include: [
              {
                model: PublicPersonProfile,
                as: 'person',
                attributes: ['id', 'firstName', 'lastName', 'photo', 'bio'],
                required: false,
              },
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'],
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
                model: PublicPersonProfile,
                as: 'person',
                attributes: ['id', 'firstName', 'lastName', 'photo'],
                required: false,
              },
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'],
                required: false,
              },
            ],
          },
        ],
      });

      const positionIds = positions.map((p) => p.id);

      // Fetch vote counts per position (include candidateUserId in group to satisfy PostgreSQL)
      const voteCounts = await DreamTeamVote.findAll({
        attributes: [
          'positionId',
          'personId',
          'candidateUserId',
          'personName',
          [sequelize.fn('COUNT', sequelize.col('id')), 'voteCount'],
        ],
        where: { positionId: { [Op.in]: positionIds } },
        group: ['positionId', 'personId', 'candidateUserId', 'personName'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        raw: true,
      });

      // Enrich vote counts with person photos for PublicPersonProfile votes
      const votedPersonIds = [...new Set(voteCounts.map((v) => v.personId).filter(Boolean))];
      if (votedPersonIds.length > 0) {
        const votedPersons = await PublicPersonProfile.findAll({
          where: { id: { [Op.in]: votedPersonIds } },
          attributes: ['id', 'firstName', 'lastName', 'photo'],
          raw: true,
        });
        const personMap = {};
        votedPersons.forEach((p) => { personMap[p.id] = p; });
        voteCounts.forEach((v) => { v.person = personMap[v.personId] || null; });
      }

      // Enrich vote counts with User avatars for candidateUserId-based votes
      const votedUserIds = [...new Set(voteCounts.map((v) => v.candidateUserId).filter(Boolean))];
      if (votedUserIds.length > 0) {
        const votedUsers = await User.findAll({
          where: { id: { [Op.in]: votedUserIds } },
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'],
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

      const data = positions.map((position) => ({
        ...position.toJSON(),
        votes: votesByPosition[position.id] || [],
        myVote: myVoteByPosition[position.id] || null,
      }));

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('dreamTeamController.getPositionsWithData error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },

  // POST /api/dream-team/vote
  vote: async (req, res) => {
    try {
      const { positionId, personId, candidateUserId } = req.body;

      if (!positionId || (!personId && !candidateUserId)) {
        return res.status(400).json({
          success: false,
          message: 'Απαιτούνται positionId και (personId ή candidateUserId).',
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

      let personName;
      if (personId) {
        const person = await PublicPersonProfile.findByPk(personId, {
          attributes: ['id', 'firstName', 'lastName'],
        });
        if (!person) {
          return res.status(404).json({
            success: false,
            message: 'Το πρόσωπο δεν βρέθηκε.',
          });
        }
        personName = `${person.firstName} ${person.lastName}`.trim();
      } else {
        const candidateUser = await User.findByPk(candidateUserId, {
          attributes: ['id', 'username', 'firstName', 'lastName'],
        });
        if (!candidateUser) {
          return res.status(404).json({
            success: false,
            message: 'Ο χρήστης δεν βρέθηκε.',
          });
        }
        personName = (`${candidateUser.firstName || ''} ${candidateUser.lastName || ''}`.trim()) || candidateUser.username;
      }

      const existing = await DreamTeamVote.findOne({
        where: { userId: req.user.id, positionId },
      });

      if (existing) {
        await existing.update({
          personId: personId || null,
          candidateUserId: candidateUserId || null,
          personName,
        });
      } else {
        await DreamTeamVote.create({
          userId: req.user.id,
          positionId,
          personId: personId || null,
          candidateUserId: candidateUserId || null,
          personName,
        });
      }

      return res.status(200).json({
        success: true,
        data: { positionId, personId: personId || null, candidateUserId: candidateUserId || null, personName },
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
      const positions = await GovernmentPosition.findAll({
        where: { isActive: true },
        order: [['order', 'ASC']],
        include: [
          {
            model: GovernmentCurrentHolder,
            as: 'currentHolders',
            where: { isActive: true },
            required: false,
            include: [
              {
                model: PublicPersonProfile,
                as: 'person',
                attributes: ['id', 'firstName', 'lastName', 'photo'],
                required: false,
              },
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'],
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
                model: PublicPersonProfile,
                as: 'person',
                attributes: ['id', 'firstName', 'lastName', 'photo'],
                required: false,
              },
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'],
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
          'personId',
          'candidateUserId',
          'personName',
          [sequelize.fn('COUNT', sequelize.col('DreamTeamVote.id')), 'voteCount'],
        ],
        where: { positionId: { [Op.in]: positionIds } },
        group: ['positionId', 'personId', 'candidateUserId', 'personName'],
        order: [[sequelize.fn('COUNT', sequelize.col('DreamTeamVote.id')), 'DESC']],
        raw: true,
      });

      // Step 2: determine winner per position and collect their personIds / candidateUserIds
      const winnerByPosition = {};
      voteCounts.forEach((v) => {
        if (!winnerByPosition[v.positionId]) {
          winnerByPosition[v.positionId] = v;
        }
      });

      const winnerPersonIds = [...new Set(
        Object.values(winnerByPosition).map((v) => v.personId).filter(Boolean)
      )];
      const winnerUserIds = [...new Set(
        Object.values(winnerByPosition).map((v) => v.candidateUserId).filter(Boolean)
      )];

      // Step 3: fetch photos separately for PublicPersonProfile winners
      const personPhotos = {};
      if (winnerPersonIds.length > 0) {
        const persons = await PublicPersonProfile.findAll({
          where: { id: { [Op.in]: winnerPersonIds } },
          attributes: ['id', 'photo'],
          raw: true,
        });
        persons.forEach((p) => { personPhotos[p.id] = p.photo; });
      }

      // Step 4: fetch avatars for User-based winners
      const userAvatars = {};
      if (winnerUserIds.length > 0) {
        const users = await User.findAll({
          where: { id: { [Op.in]: winnerUserIds } },
          attributes: ['id', 'avatar'],
          raw: true,
        });
        users.forEach((u) => { userAvatars[u.id] = u.avatar; });
      }

      // Total votes per position
      const totalByPosition = {};
      voteCounts.forEach((v) => {
        totalByPosition[v.positionId] = (totalByPosition[v.positionId] || 0) + parseInt(v.voteCount, 10);
      });

      const dreamTeam = positions.map((position) => {
        const winner = winnerByPosition[position.id];
        const total = totalByPosition[position.id] || 0;
        return {
          position: position.toJSON(),
          winner: winner
            ? {
                personId: winner.personId,
                candidateUserId: winner.candidateUserId,
                personName: winner.personName,
                photo: personPhotos[winner.personId] || null,
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
            model: PublicPersonProfile,
            as: 'person',
            attributes: ['id', 'firstName', 'lastName', 'photo'],
            required: false,
          },
          {
            model: User,
            as: 'candidateUser',
            attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'],
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
  adminGetPositions: async (req, res) => {
    try {
      const positions = await GovernmentPosition.findAll({
        order: [['order', 'ASC']],
        include: [
          {
            model: GovernmentCurrentHolder,
            as: 'currentHolders',
            required: false,
            include: [
              {
                model: PublicPersonProfile,
                as: 'person',
                attributes: ['id', 'firstName', 'lastName', 'photo'],
                required: false,
              },
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'],
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
                model: PublicPersonProfile,
                as: 'person',
                attributes: ['id', 'firstName', 'lastName', 'photo'],
                required: false,
              },
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'],
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
      const { positionId, personId, userId, reason, order: ord } = req.body;
      if (!positionId || (!personId && !userId)) {
        return res.status(400).json({ success: false, message: 'Απαιτείται personId (PublicPersonProfile) ή userId (verified app user).' });
      }
      const position = await GovernmentPosition.findByPk(positionId);
      if (!position) {
        return res.status(404).json({ success: false, message: 'Η θέση δεν βρέθηκε.' });
      }
      if (personId) {
        const person = await PublicPersonProfile.findByPk(personId);
        if (!person) {
          return res.status(404).json({ success: false, message: 'Το πρόσωπο δεν βρέθηκε.' });
        }
      }
      if (userId) {
        const user = await User.findByPk(userId, { attributes: ['id', 'isVerified', 'searchable'] });
        if (!user) {
          return res.status(404).json({ success: false, message: 'Ο χρήστης δεν βρέθηκε.' });
        }
        if (!user.isVerified || !user.searchable) {
          return res.status(400).json({ success: false, message: 'Μόνο επαληθευμένοι χρήστες με δημόσιο προφίλ μπορούν να προστεθούν.' });
        }
      }
      const suggestion = await GovernmentPositionSuggestion.create({
        positionId,
        personId: personId || null,
        userId: userId || null,
        reason: reason?.trim() || null,
        order: ord ?? 0,
        isActive: true,
      });
      const suggestionWithPerson = await GovernmentPositionSuggestion.findByPk(suggestion.id, {
        include: [
          { model: PublicPersonProfile, as: 'person', attributes: ['id', 'firstName', 'lastName', 'photo'], required: false },
          { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'], required: false },
        ],
      });
      return res.status(201).json({ success: true, data: suggestionWithPerson });
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
      const { personId, userId, reason, order: ord, isActive } = req.body;
      if (personId !== undefined && personId !== null) {
        const person = await PublicPersonProfile.findByPk(personId);
        if (!person) {
          return res.status(404).json({ success: false, message: 'Το πρόσωπο δεν βρέθηκε.' });
        }
      }
      if (userId !== undefined && userId !== null) {
        const user = await User.findByPk(userId, { attributes: ['id', 'isVerified', 'searchable'] });
        if (!user) {
          return res.status(404).json({ success: false, message: 'Ο χρήστης δεν βρέθηκε.' });
        }
        if (!user.isVerified || !user.searchable) {
          return res.status(400).json({ success: false, message: 'Μόνο επαληθευμένοι χρήστες με δημόσιο προφίλ μπορούν να προστεθούν.' });
        }
      }
      await suggestion.update({
        ...(personId !== undefined && { personId: personId || null }),
        ...(userId !== undefined && { userId: userId || null }),
        ...(reason !== undefined && { reason: reason?.trim() || null }),
        ...(ord !== undefined && { order: ord }),
        ...(isActive !== undefined && { isActive }),
      });
      const updated = await GovernmentPositionSuggestion.findByPk(suggestion.id, {
        include: [
          { model: PublicPersonProfile, as: 'person', attributes: ['id', 'firstName', 'lastName', 'photo'], required: false },
          { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'], required: false },
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
      const { positionId, personId, userId, since, notes } = req.body;
      if (!positionId || (!personId && !userId)) {
        return res.status(400).json({
          success: false,
          message: 'Απαιτείται personId (PublicPersonProfile) ή userId (verified app user).',
        });
      }
      const position = await GovernmentPosition.findByPk(positionId);
      if (!position) {
        return res.status(404).json({ success: false, message: 'Η θέση δεν βρέθηκε.' });
      }
      if (personId) {
        const person = await PublicPersonProfile.findByPk(personId);
        if (!person) {
          return res.status(404).json({ success: false, message: 'Το πρόσωπο δεν βρέθηκε.' });
        }
      }
      if (userId) {
        const user = await User.findByPk(userId, { attributes: ['id', 'isVerified', 'searchable'] });
        if (!user) {
          return res.status(404).json({ success: false, message: 'Ο χρήστης δεν βρέθηκε.' });
        }
        if (!user.isVerified || !user.searchable) {
          return res.status(400).json({ success: false, message: 'Μόνο επαληθευμένοι χρήστες με δημόσιο προφίλ μπορούν να προστεθούν.' });
        }
      }

      // Deactivate any existing active holder for this position
      await GovernmentCurrentHolder.update(
        { isActive: false },
        { where: { positionId, isActive: true } }
      );

      const holder = await GovernmentCurrentHolder.create({
        positionId,
        personId: personId || null,
        userId: userId || null,
        since: since || null,
        notes: notes?.trim() || null,
        isActive: true,
      });

      const holderWithPerson = await GovernmentCurrentHolder.findByPk(holder.id, {
        include: [
          { model: PublicPersonProfile, as: 'person', attributes: ['id', 'firstName', 'lastName', 'photo'], required: false },
          { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'], required: false },
        ],
      });

      return res.status(201).json({ success: true, data: holderWithPerson });
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
      const { personId, userId, since, notes, isActive } = req.body;
      if (personId !== undefined && personId !== null) {
        const person = await PublicPersonProfile.findByPk(personId);
        if (!person) {
          return res.status(404).json({ success: false, message: 'Το πρόσωπο δεν βρέθηκε.' });
        }
      }
      if (userId !== undefined && userId !== null) {
        const user = await User.findByPk(userId, { attributes: ['id', 'isVerified', 'searchable'] });
        if (!user) {
          return res.status(404).json({ success: false, message: 'Ο χρήστης δεν βρέθηκε.' });
        }
        if (!user.isVerified || !user.searchable) {
          return res.status(400).json({ success: false, message: 'Μόνο επαληθευμένοι χρήστες με δημόσιο προφίλ μπορούν να προστεθούν.' });
        }
      }
      await holder.update({
        ...(personId !== undefined && { personId: personId || null }),
        ...(userId !== undefined && { userId: userId || null }),
        ...(since !== undefined && { since: since || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      });
      const updated = await GovernmentCurrentHolder.findByPk(holder.id, {
        include: [
          { model: PublicPersonProfile, as: 'person', attributes: ['id', 'firstName', 'lastName', 'photo'], required: false },
          { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'], required: false },
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
      await holder.destroy();
      return res.status(200).json({ success: true, message: 'Ο κάτοχος διαγράφηκε.' });
    } catch (error) {
      console.error('dreamTeamController.adminDeleteHolder error:', error);
      return res.status(500).json({ success: false, message: 'Σφάλμα διακομιστή.' });
    }
  },
};

module.exports = dreamTeamController;
