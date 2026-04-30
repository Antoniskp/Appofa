'use strict';

/**
 * Controller for managing platform-level location-scoped role assignments
 * (UserLocationRole join table).
 *
 * These are distinct from LocationRole (civic positions like mayor/governor).
 * Platform roles here are things like 'moderator' — users assigned to
 * moderate a specific location.
 *
 * Endpoints (all admin-only):
 *   GET    /api/locations/:locationId/platform-roles   list assignments for a location
 *   POST   /api/locations/:locationId/platform-roles   add a new assignment
 *   DELETE /api/locations/:locationId/platform-roles/:id   remove one assignment
 */

const { UserLocationRole, User, Location } = require('../models');
const { getAncestorLocationIds } = require('../utils/locationUtils');

const ALLOWED_ROLE_KEYS = ['moderator'];

/**
 * GET /api/locations/:locationId/platform-roles
 * Admin only.
 * Returns all UserLocationRole records for this exact location.
 */
exports.listAssignments = async (req, res) => {
  try {
    const { locationId } = req.params;
    const parsedId = parseInt(locationId, 10);
    if (!Number.isInteger(parsedId) || parsedId < 1) {
      return res.status(400).json({ success: false, message: 'Invalid location ID.' });
    }

    const location = await Location.findByPk(parsedId, { attributes: ['id', 'name'] });
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found.' });
    }

    const assignments = await UserLocationRole.findAll({
      where: { locationId: parsedId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'avatar', 'slug'],
          required: true,
        },
      ],
      order: [['roleKey', 'ASC'], ['createdAt', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      assignments: assignments.map((a) => ({
        id: a.id,
        userId: a.userId,
        locationId: a.locationId,
        roleKey: a.roleKey,
        createdAt: a.createdAt,
        user: a.user,
      })),
    });
  } catch (err) {
    console.error('listAssignments error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * POST /api/locations/:locationId/platform-roles
 * Admin only.
 * Body: { userId, roleKey }
 *
 * Validates:
 * - roleKey must be in ALLOWED_ROLE_KEYS
 * - userId must exist
 * - For 'moderator': locationId must be an ancestor-or-self of user's homeLocationId
 * - Duplicate (userId, locationId, roleKey) is prevented (DB unique constraint + pre-check)
 *
 * Side-effect: ensures the user's global role is set to 'moderator' when roleKey='moderator'.
 */
exports.addAssignment = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { userId, roleKey } = req.body;

    const parsedLocationId = parseInt(locationId, 10);
    if (!Number.isInteger(parsedLocationId) || parsedLocationId < 1) {
      return res.status(400).json({ success: false, message: 'Invalid location ID.' });
    }

    if (!roleKey || !ALLOWED_ROLE_KEYS.includes(roleKey)) {
      return res.status(400).json({
        success: false,
        message: `Invalid roleKey. Allowed values: ${ALLOWED_ROLE_KEYS.join(', ')}.`,
      });
    }

    const parsedUserId = parseInt(userId, 10);
    if (!Number.isInteger(parsedUserId) || parsedUserId < 1) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    const location = await Location.findByPk(parsedLocationId, { attributes: ['id', 'name'] });
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found.' });
    }

    const user = await User.findByPk(parsedUserId, {
      attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'avatar', 'slug', 'homeLocationId', 'role'],
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Ancestor-chain validation for moderator assignments:
    // The assigned location must be the user's home location or one of its ancestors.
    if (roleKey === 'moderator') {
      if (!user.homeLocationId) {
        return res.status(400).json({
          success: false,
          message: 'User does not have a home location set. Set a home location first.',
        });
      }
      const ancestorIds = await getAncestorLocationIds(user.homeLocationId, true);
      if (!ancestorIds.includes(parsedLocationId)) {
        return res.status(400).json({
          success: false,
          message:
            'The assigned location must be the user\'s home location or one of its ancestor locations.',
        });
      }
    }

    // Duplicate check (DB constraint will also catch this, but provide a clear message)
    const existing = await UserLocationRole.findOne({
      where: { userId: parsedUserId, locationId: parsedLocationId, roleKey },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This user already has this role assignment for the location.',
      });
    }

    const assignment = await UserLocationRole.create({
      userId: parsedUserId,
      locationId: parsedLocationId,
      roleKey,
    });

    // Ensure user's global role is set to 'moderator' when adding a moderator assignment
    if (roleKey === 'moderator' && user.role !== 'moderator' && user.role !== 'admin') {
      await user.update({ role: 'moderator' });
    }

    return res.status(201).json({
      success: true,
      assignment: {
        id: assignment.id,
        userId: assignment.userId,
        locationId: assignment.locationId,
        roleKey: assignment.roleKey,
        createdAt: assignment.createdAt,
        user: {
          id: user.id,
          username: user.username,
          firstNameNative: user.firstNameNative,
          lastNameNative: user.lastNameNative,
          firstNameEn: user.firstNameEn,
          lastNameEn: user.lastNameEn,
          avatar: user.avatar,
          slug: user.slug,
        },
      },
    });
  } catch (err) {
    // Handle unique constraint violation gracefully
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'This user already has this role assignment for the location.',
      });
    }
    console.error('addAssignment error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * DELETE /api/locations/:locationId/platform-roles/:assignmentId
 * Admin only.
 * Removes one UserLocationRole record.
 *
 * If this was the last moderator assignment for the user AND the user's global
 * role is still 'moderator', the global role is automatically downgraded to 'viewer'
 * so the user doesn't retain moderator powers without any scope.
 */
exports.removeAssignment = async (req, res) => {
  try {
    const { locationId, assignmentId } = req.params;
    const parsedLocationId = parseInt(locationId, 10);
    const parsedAssignmentId = parseInt(assignmentId, 10);

    if (!Number.isInteger(parsedLocationId) || parsedLocationId < 1) {
      return res.status(400).json({ success: false, message: 'Invalid location ID.' });
    }
    if (!Number.isInteger(parsedAssignmentId) || parsedAssignmentId < 1) {
      return res.status(400).json({ success: false, message: 'Invalid assignment ID.' });
    }

    const assignment = await UserLocationRole.findOne({
      where: { id: parsedAssignmentId, locationId: parsedLocationId },
    });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const { userId, roleKey } = assignment;
    await assignment.destroy();

    // If moderator role was removed and user has no remaining moderator assignments,
    // downgrade their global role to 'viewer'.
    if (roleKey === 'moderator') {
      const remainingCount = await UserLocationRole.count({
        where: { userId, roleKey: 'moderator' },
      });
      if (remainingCount === 0) {
        const user = await User.findByPk(userId, { attributes: ['id', 'role'] });
        if (user && user.role === 'moderator') {
          await user.update({ role: 'viewer' });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Assignment removed.' });
  } catch (err) {
    console.error('removeAssignment error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
