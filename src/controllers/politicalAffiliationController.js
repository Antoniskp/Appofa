'use strict';

const { UserPoliticalAffiliation, Organization, User } = require('../models');

const VALID_ENDORSEMENT_LEVELS = new Set(['active', 'passive', 'neutral']);

const ORG_ATTRIBUTES = ['id', 'name', 'slug', 'type', 'logo', 'isVerified', 'politicalPosition'];

/**
 * GET /api/users/:id/political-affiliations
 * Public — returns all political affiliations for a user.
 */
async function getAffiliations(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }

    const user = await User.findByPk(userId, { attributes: ['id', 'claimStatus'] });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const affiliations = await UserPoliticalAffiliation.findAll({
      where: { userId },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ORG_ATTRIBUTES,
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    return res.status(200).json({ success: true, data: { affiliations } });
  } catch (err) {
    console.error('getAffiliations error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching affiliations.' });
  }
}

/**
 * POST /api/users/:id/political-affiliations
 * Authenticated — owner can add an affiliation.
 * Body: { organizationId, endorsementLevel? }
 */
async function addAffiliation(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }

    const requesterId = req.user.id;
    const isAdmin = ['admin', 'moderator'].includes(req.user.role);
    if (!isAdmin && requesterId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const { organizationId, endorsementLevel = 'neutral' } = req.body;
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'organizationId is required.' });
    }
    if (!VALID_ENDORSEMENT_LEVELS.has(endorsementLevel)) {
      return res.status(400).json({ success: false, message: 'Invalid endorsement level. Must be active, passive, or neutral.' });
    }

    const org = await Organization.findByPk(organizationId, { attributes: ['id', 'type'] });
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }
    if (org.type !== 'party') {
      return res.status(400).json({ success: false, message: 'Only party organizations can be used for political affiliations.' });
    }

    const [affiliation, created] = await UserPoliticalAffiliation.findOrCreate({
      where: { userId, organizationId },
      defaults: { endorsementLevel },
    });

    if (!created) {
      return res.status(409).json({ success: false, message: `Affiliation already exists. Use PATCH /api/users/${userId}/political-affiliations/${organizationId} to update the endorsement level.` });
    }

    const result = await UserPoliticalAffiliation.findByPk(affiliation.id, {
      include: [{ model: Organization, as: 'organization', attributes: ORG_ATTRIBUTES }],
    });

    return res.status(201).json({ success: true, data: { affiliation: result } });
  } catch (err) {
    console.error('addAffiliation error:', err);
    return res.status(500).json({ success: false, message: 'Error adding affiliation.' });
  }
}

/**
 * PATCH /api/users/:id/political-affiliations/:organizationId
 * Authenticated — owner can update endorsement level.
 * Body: { endorsementLevel }
 */
async function updateAffiliation(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const organizationId = parseInt(req.params.organizationId, 10);
    if (!userId || isNaN(userId) || !organizationId || isNaN(organizationId)) {
      return res.status(400).json({ success: false, message: 'Invalid parameters.' });
    }

    const requesterId = req.user.id;
    const isAdmin = ['admin', 'moderator'].includes(req.user.role);
    if (!isAdmin && requesterId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const { endorsementLevel } = req.body;
    if (!endorsementLevel || !VALID_ENDORSEMENT_LEVELS.has(endorsementLevel)) {
      return res.status(400).json({ success: false, message: 'Invalid endorsement level. Must be active, passive, or neutral.' });
    }

    const affiliation = await UserPoliticalAffiliation.findOne({ where: { userId, organizationId } });
    if (!affiliation) {
      return res.status(404).json({ success: false, message: 'Affiliation not found.' });
    }

    affiliation.endorsementLevel = endorsementLevel;
    await affiliation.save();

    const result = await UserPoliticalAffiliation.findByPk(affiliation.id, {
      include: [{ model: Organization, as: 'organization', attributes: ORG_ATTRIBUTES }],
    });

    return res.status(200).json({ success: true, data: { affiliation: result } });
  } catch (err) {
    console.error('updateAffiliation error:', err);
    return res.status(500).json({ success: false, message: 'Error updating affiliation.' });
  }
}

/**
 * DELETE /api/users/:id/political-affiliations/:organizationId
 * Authenticated — owner can remove an affiliation.
 */
async function removeAffiliation(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const organizationId = parseInt(req.params.organizationId, 10);
    if (!userId || isNaN(userId) || !organizationId || isNaN(organizationId)) {
      return res.status(400).json({ success: false, message: 'Invalid parameters.' });
    }

    const requesterId = req.user.id;
    const isAdmin = ['admin', 'moderator'].includes(req.user.role);
    if (!isAdmin && requesterId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const affiliation = await UserPoliticalAffiliation.findOne({ where: { userId, organizationId } });
    if (!affiliation) {
      return res.status(404).json({ success: false, message: 'Affiliation not found.' });
    }

    await affiliation.destroy();
    return res.status(200).json({ success: true, message: 'Affiliation removed.' });
  } catch (err) {
    console.error('removeAffiliation error:', err);
    return res.status(500).json({ success: false, message: 'Error removing affiliation.' });
  }
}

module.exports = {
  getAffiliations,
  addAffiliation,
  updateAffiliation,
  removeAffiliation,
};
