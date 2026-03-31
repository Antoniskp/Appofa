'use strict';

const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
  GovernmentPosition,
  GovernmentCurrentHolder,
  GovernmentPositionSuggestion,
  DreamTeamVote,
  PublicPersonProfile,
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
              },
            ],
          },
          {
            model: GovernmentPositionSuggestion,
            as: 'aiSuggestions',
            where: { isActive: true },
            required: false,
            order: [['order', 'ASC']],
          },
        ],
      });

      const positionIds = positions.map((p) => p.id);

      // Fetch vote counts per position
      const voteCounts = await DreamTeamVote.findAll({
        attributes: [
          'positionId',
          'personId',
          'personName',
          [sequelize.fn('COUNT', sequelize.col('id')), 'voteCount'],
        ],
        where: { positionId: { [Op.in]: positionIds } },
        group: ['positionId', 'personId', 'personName'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        raw: true,
      });

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
      const { positionId, personId } = req.body;

      if (!positionId || !personId) {
        return res.status(400).json({
          success: false,
          message: 'Απαιτούνται positionId και personId.',
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

      const person = await PublicPersonProfile.findByPk(personId, {
        attributes: ['id', 'firstName', 'lastName'],
      });
      if (!person) {
        return res.status(404).json({
          success: false,
          message: 'Το πρόσωπο δεν βρέθηκε.',
        });
      }

      const personName = `${person.firstName} ${person.lastName}`.trim();

      const existing = await DreamTeamVote.findOne({
        where: { userId: req.user.id, positionId },
      });

      if (existing) {
        await existing.update({ personId, personName });
      } else {
        await DreamTeamVote.create({
          userId: req.user.id,
          positionId,
          personId,
          personName,
        });
      }

      return res.status(200).json({
        success: true,
        data: { positionId, personId, personName },
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
              },
            ],
          },
          {
            model: GovernmentPositionSuggestion,
            as: 'aiSuggestions',
            where: { isActive: true },
            required: false,
            order: [['order', 'ASC']],
          },
        ],
      });

      const positionIds = positions.map((p) => p.id);

      // Step 1: aggregate WITHOUT include to avoid GROUP BY conflict in PostgreSQL
      const voteCounts = await DreamTeamVote.findAll({
        attributes: [
          'positionId',
          'personId',
          'personName',
          [sequelize.fn('COUNT', sequelize.col('DreamTeamVote.id')), 'voteCount'],
        ],
        where: { positionId: { [Op.in]: positionIds } },
        group: ['positionId', 'personId', 'personName'],
        order: [[sequelize.fn('COUNT', sequelize.col('DreamTeamVote.id')), 'DESC']],
        raw: true,
      });

      // Step 2: determine winner per position and collect their personIds
      const winnerByPosition = {};
      voteCounts.forEach((v) => {
        if (!winnerByPosition[v.positionId]) {
          winnerByPosition[v.positionId] = v;
        }
      });

      const winnerPersonIds = [...new Set(
        Object.values(winnerByPosition).map((v) => v.personId).filter(Boolean)
      )];

      // Step 3: fetch photos separately
      const personPhotos = {};
      if (winnerPersonIds.length > 0) {
        const persons = await PublicPersonProfile.findAll({
          where: { id: { [Op.in]: winnerPersonIds } },
          attributes: ['id', 'photo'],
          raw: true,
        });
        persons.forEach((p) => { personPhotos[p.id] = p.photo; });
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
                personName: winner.personName,
                photo: personPhotos[winner.personId] || null,
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
            attributes: ['id', 'slug', 'title', 'category'],
          },
          {
            model: PublicPersonProfile,
            as: 'person',
            attributes: ['id', 'firstName', 'lastName', 'photo'],
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
              },
            ],
          },
          {
            model: GovernmentPositionSuggestion,
            as: 'aiSuggestions',
            required: false,
            order: [['order', 'ASC']],
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
      const { positionId, name, reason, order: ord } = req.body;
      if (!positionId || !name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Απαιτούνται positionId και name.' });
      }
      const position = await GovernmentPosition.findByPk(positionId);
      if (!position) {
        return res.status(404).json({ success: false, message: 'Η θέση δεν βρέθηκε.' });
      }
      const suggestion = await GovernmentPositionSuggestion.create({
        positionId,
        name: name.trim(),
        reason: reason?.trim() || null,
        order: ord ?? 0,
        isActive: true,
      });
      return res.status(201).json({ success: true, data: suggestion });
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
      const { name, reason, order: ord, isActive } = req.body;
      await suggestion.update({
        ...(name !== undefined && { name: name.trim() }),
        ...(reason !== undefined && { reason: reason?.trim() || null }),
        ...(ord !== undefined && { order: ord }),
        ...(isActive !== undefined && { isActive }),
      });
      return res.status(200).json({ success: true, data: suggestion });
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
      const { positionId, personId, holderName, holderPhoto, since, notes } = req.body;
      if (!positionId || (!personId && !holderName?.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Απαιτούνται positionId και personId ή holderName.',
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

      // Deactivate any existing active holder for this position
      await GovernmentCurrentHolder.update(
        { isActive: false },
        { where: { positionId, isActive: true } }
      );

      const holder = await GovernmentCurrentHolder.create({
        positionId,
        personId: personId || null,
        holderName: holderName?.trim() || null,
        holderPhoto: holderPhoto?.trim() || null,
        since: since || null,
        notes: notes?.trim() || null,
        isActive: true,
      });

      const holderWithPerson = await GovernmentCurrentHolder.findByPk(holder.id, {
        include: [{ model: PublicPersonProfile, as: 'person', attributes: ['id', 'firstName', 'lastName', 'photo'] }],
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
      const { personId, holderName, holderPhoto, since, notes, isActive } = req.body;
      if (personId) {
        const person = await PublicPersonProfile.findByPk(personId);
        if (!person) {
          return res.status(404).json({ success: false, message: 'Το πρόσωπο δεν βρέθηκε.' });
        }
      }
      await holder.update({
        ...(personId !== undefined && { personId: personId || null }),
        ...(holderName !== undefined && { holderName: holderName?.trim() || null }),
        ...(holderPhoto !== undefined && { holderPhoto: holderPhoto?.trim() || null }),
        ...(since !== undefined && { since: since || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      });
      const updated = await GovernmentCurrentHolder.findByPk(holder.id, {
        include: [{ model: PublicPersonProfile, as: 'person', attributes: ['id', 'firstName', 'lastName', 'photo'] }],
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
