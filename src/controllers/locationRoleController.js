const { LocationRole, Location, User, GovernmentPosition, GovernmentCurrentHolder } = require('../models');
const locationRolesConfig = require('../../config/locationRoles.json');

// Maps LocationRole roleKey → universal positionTypeKey used in GovernmentPositions.
// This allows the sync to work for any country dynamically — the countryCode is read
// from the Location record at runtime instead of being hardcoded to Greece slugs.
const ROLE_KEY_TO_POSITION_TYPE = {
  president: 'head_of_state',
  prime_minister: 'prime_minister',
  parliament_speaker: 'parliament_speaker',
};

/**
 * Fire-and-forget sync: keeps GovernmentCurrentHolder records in sync with
 * country LocationRole assignments for national positions.
 *
 * @param {string} roleKey    - LocationRole roleKey (e.g. 'president')
 * @param {number|null} userId - User id to assign (null to clear)
 * @param {string} [countryCode='GR'] - ISO country code from the Location record
 */
async function syncLocationRoleToHolder(roleKey, userId, countryCode = 'GR') {
  try {
    const positionTypeKey = ROLE_KEY_TO_POSITION_TYPE[roleKey];
    if (!positionTypeKey) return;

    const position = await GovernmentPosition.findOne({
      where: { positionTypeKey, countryCode, scope: 'national' },
      attributes: ['id'],
    });
    if (!position) {
      console.warn(`syncLocationRoleToHolder: no position found for positionTypeKey=${positionTypeKey} countryCode=${countryCode}, skipping sync`);
      return;
    }

    // Delete all existing holders for this position (stale data should not be kept)
    await GovernmentCurrentHolder.destroy({ where: { positionId: position.id } });

    // Create a new active holder if someone is assigned
    if (userId) {
      await GovernmentCurrentHolder.create({
        positionId: position.id,
        userId,
        isActive: true,
      });
    }
  } catch (err) {
    console.error('syncLocationRoleToHolder error (non-fatal):', err);
  }
}

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

    const location = await Location.findByPk(locationId, { attributes: ['id', 'type', 'code'] });
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const definitions = getRoleDefinitions(location.type);

    const assignments = await LocationRole.findAll({
      where: { locationId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'slug', 'photo'],
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
 * Body: { roles: [{ roleKey, userId? }, ...] }
 *
 * Bulk upsert: creates or updates LocationRole records for the location.
 * If userId is null, the slot is cleared (kept but unassigned).
 */
exports.upsertRoles = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { roles } = req.body;

    if (!Array.isArray(roles)) {
      return res.status(400).json({ success: false, message: '"roles" must be an array' });
    }

    const location = await Location.findByPk(locationId, { attributes: ['id', 'type', 'code'] });
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
      if (entry.userId != null) {
        const user = await User.findByPk(entry.userId, { attributes: ['id'] });
        if (!user) {
          return res.status(400).json({ success: false, message: `User with id ${entry.userId} not found` });
        }
      }
    }

    // Build a quick lookup: roleKey → definition (for sortOrder)
    const defByKey = Object.fromEntries(definitions.map((d) => [d.key, d]));

    // Upsert each role
    const upserted = [];
    for (const entry of roles) {
      const { roleKey, userId = null } = entry;
      const sortOrder = defByKey[roleKey]?.order ?? 0;

      const [record] = await LocationRole.findOrCreate({
        where: { locationId, roleKey },
        defaults: { locationId, roleKey, userId, sortOrder },
      });

      if (record.userId !== userId) {
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
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'slug', 'photo'],
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

    // Sync national roles to GovernmentCurrentHolder (fire-and-forget, country locations only)
    if (location.type === 'country') {
      const locationCountryCode = (location.code || 'GR').toUpperCase();
      for (const entry of roles) {
        const { roleKey, userId } = entry;
        if (ROLE_KEY_TO_POSITION_TYPE[roleKey]) {
          syncLocationRoleToHolder(roleKey, userId || null, locationCountryCode)
            .catch((err) => console.error('upsertRoles syncLocationRoleToHolder error:', err));
        }
      }
    }

    return res.status(200).json({ success: true, locationType: location.type, roles: mergedRoles });
  } catch (err) {
    console.error('upsertRoles error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
