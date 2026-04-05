const { LocationRole, Location, PublicPersonProfile, User } = require('../models');
const locationRolesConfig = require('../../config/locationRoles.json');

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Get the predefined role definitions for a given location tier.
 * Returns an empty array for unknown tiers.
 */
const getRoleDefinitions = (locationType) => {
  return (locationRolesConfig.roles[locationType] || []).slice().sort((a, b) => a.order - b.order);
};

// ---------------------------------------------------------------------------
// Controller functions
// ---------------------------------------------------------------------------

/**
 * GET /api/locations/:locationId/roles
 * Public endpoint.
 * Returns the predefined role definitions for the location's tier merged with
 * the current assignments stored in LocationRoles.
 */
exports.getRoles = async (req, res) => {
  try {
    const { locationId } = req.params;

    const location = await Location.findByPk(locationId, { attributes: ['id', 'type'] });
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const definitions = getRoleDefinitions(location.type);

    const assignments = await LocationRole.findAll({
      where: { locationId },
      include: [
        {
          model: PublicPersonProfile,
          as: 'person',
          attributes: ['id', 'firstName', 'lastName', 'photo', 'slug'],
          required: false,
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'],
          required: false,
        },
      ],
    });

    // Build a map of roleKey → assignment for fast lookup
    const assignmentMap = {};
    for (const a of assignments) {
      assignmentMap[a.roleKey] = a;
    }

    // Merge definitions with assignments
    const roles = definitions.map((def) => ({
      ...def,
      assignment: assignmentMap[def.key] || null,
    }));

    return res.status(200).json({
      success: true,
      locationType: location.type,
      roles,
    });
  } catch (err) {
    console.error('getRoles error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/locations/:locationId/roles
 * Moderator/Admin only.
 * Body: { roles: [{ roleKey, personId?, userId? }, ...] }
 *
 * Bulk upsert: creates or updates LocationRole records for the location.
 * If both personId and userId are null, the slot is cleared (kept but unassigned).
 */
exports.upsertRoles = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { roles } = req.body;

    if (!Array.isArray(roles)) {
      return res.status(400).json({ success: false, message: '"roles" must be an array' });
    }

    const location = await Location.findByPk(locationId, { attributes: ['id', 'type'] });
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const definitions = getRoleDefinitions(location.type);
    const validKeys = new Set(definitions.map((d) => d.key));

    // Validate each entry
    for (const entry of roles) {
      if (!entry.roleKey || typeof entry.roleKey !== 'string') {
        return res.status(400).json({ success: false, message: 'Each role entry must have a "roleKey" string' });
      }
      if (!validKeys.has(entry.roleKey)) {
        return res.status(400).json({
          success: false,
          message: `Invalid roleKey "${entry.roleKey}" for location type "${location.type}"`,
        });
      }
      if (entry.personId != null) {
        const person = await PublicPersonProfile.findByPk(entry.personId, { attributes: ['id'] });
        if (!person) {
          return res.status(400).json({ success: false, message: `Person with id ${entry.personId} not found` });
        }
      }
      if (entry.userId != null) {
        const user = await User.findByPk(entry.userId, { attributes: ['id'] });
        if (!user) {
          return res.status(400).json({ success: false, message: `User with id ${entry.userId} not found` });
        }
      }
    }

    // Upsert each role
    const upserted = [];
    for (const entry of roles) {
      const { roleKey, personId = null, userId = null } = entry;

      const [record] = await LocationRole.findOrCreate({
        where: { locationId, roleKey },
        defaults: { locationId, roleKey, personId, userId, sortOrder: validKeys.size },
      });

      if (record.personId !== personId || record.userId !== userId) {
        record.personId = personId;
        record.userId = userId;
        await record.save();
      }

      upserted.push(record);
    }

    // Re-fetch with associations for the response
    const updated = await LocationRole.findAll({
      where: { locationId },
      include: [
        {
          model: PublicPersonProfile,
          as: 'person',
          attributes: ['id', 'firstName', 'lastName', 'photo', 'slug'],
          required: false,
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'],
          required: false,
        },
      ],
    });

    const assignmentMap = {};
    for (const a of updated) {
      assignmentMap[a.roleKey] = a;
    }

    const mergedRoles = definitions.map((def) => ({
      ...def,
      assignment: assignmentMap[def.key] || null,
    }));

    return res.status(200).json({ success: true, locationType: location.type, roles: mergedRoles });
  } catch (err) {
    console.error('upsertRoles error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
