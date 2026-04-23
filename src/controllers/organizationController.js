'use strict';

const { Op } = require('sequelize');
const { Organization, OrganizationMember, User, Location, Poll, Suggestion, sequelize } = require('../models');
const organizationService = require('../services/organizationService');
const { normalizeRequiredText, normalizeEnum } = require('../utils/validators');
const { isActiveMember, isOrgAdmin } = require('../utils/organizationUtils');
const { randomUUID } = require('crypto');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;
const MEMBER_STATUSES = ['active', 'invited', 'pending'];
const ASSIGNABLE_MEMBER_ROLES = ['admin', 'moderator', 'member'];
const ORG_CONTENT_VISIBILITIES = ['members_only', 'public'];
const ORG_SUGGESTION_TYPES = ['idea', 'problem', 'problem_request', 'location_suggestion'];

const ORGANIZATION_BASE_INCLUDE = [
  {
    model: User,
    as: 'createdBy',
    attributes: ['id', 'username', 'avatar'],
  },
  {
    model: Location,
    as: 'location',
    attributes: ['id', 'name', 'slug'],
    required: false,
  },
];

function parsePagination(query = {}) {
  const page = Math.max(DEFAULT_PAGE, parseInt(query.page, 10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  return { page, limit, offset: (page - 1) * limit };
}

function parseOptionalBoolean(value) {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return null;
}

function parsePositiveInt(value) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function requireOrganizationById(organizationId, attributes = ['id', 'isPublic']) {
  return Organization.findByPk(organizationId, { attributes });
}

async function hasOrganizationManageAccess(organizationId, user) {
  if (!user) return false;
  return isOrgAdmin(organizationId, user.id, user.role);
}

function toOrgVisibility(value) {
  return value === 'members_only' ? 'private' : value;
}

function fromOrgVisibility(value) {
  return value === 'private' ? 'members_only' : value;
}

function serializeOrgPoll(poll) {
  const data = poll.toJSON ? poll.toJSON() : poll;
  return {
    ...data,
    visibility: fromOrgVisibility(data.visibility),
  };
}

function serializeOrgSuggestion(suggestion) {
  const data = suggestion.toJSON ? suggestion.toJSON() : suggestion;
  return {
    ...data,
    visibility: fromOrgVisibility(data.visibility),
  };
}

const organizationController = {
  getOrganizations: async (req, res) => {
    try {
      const { type, search } = req.query;
      const { page, limit, offset } = parsePagination(req.query);

      const where = {
        ...organizationService.buildSearchWhere(search),
      };

      if (type) {
        if (!organizationService.ORGANIZATION_TYPES.includes(type)) {
          return res.status(400).json({ success: false, message: 'Invalid organization type.' });
        }
        where.type = type;
      }

      const { count, rows } = await Organization.findAndCountAll({
        where,
        include: ORGANIZATION_BASE_INCLUDE,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      return res.status(200).json({
        success: true,
        data: {
          organizations: rows,
          pagination: {
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(count / limit)),
            totalItems: count,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error('organizationController.getOrganizations error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch organizations.' });
    }
  },

  getOrganizationBySlug: async (req, res) => {
    try {
      const organization = await Organization.findOne({
        where: { slug: req.params.slug },
        include: ORGANIZATION_BASE_INCLUDE,
      });

      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      return res.status(200).json({ success: true, data: { organization } });
    } catch (error) {
      console.error('organizationController.getOrganizationBySlug error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch organization.' });
    }
  },

  createOrganization: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const {
        name,
        type,
        description,
        logo,
        website,
        contactEmail,
        locationId,
        isPublic,
        isVerified,
      } = req.body || {};

      if (!name || typeof name !== 'string' || !name.trim()) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Name is required.' });
      }

      if (!organizationService.ORGANIZATION_TYPES.includes(type)) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Invalid organization type.' });
      }

      const baseName = name.trim();
      const slug = await organizationService.generateSlug(baseName);

      const parsedIsPublic = parseOptionalBoolean(isPublic);
      if (parsedIsPublic === null) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'isPublic must be a boolean.' });
      }

      const parsedIsVerified = parseOptionalBoolean(isVerified);
      if (parsedIsVerified === null) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'isVerified must be a boolean.' });
      }

      const organization = await Organization.create({
        name: baseName,
        slug,
        type,
        description: description || null,
        logo: logo || null,
        website: website || null,
        contactEmail: contactEmail || null,
        locationId: locationId || null,
        isPublic: parsedIsPublic ?? true,
        isVerified: parsedIsVerified ?? false,
        createdByUserId: req.user.id,
      }, { transaction });

      await OrganizationMember.create({
        organizationId: organization.id,
        userId: req.user.id,
        role: 'owner',
        status: 'active',
      }, { transaction });

      await transaction.commit();

      const createdOrganization = await Organization.findByPk(organization.id, {
        include: ORGANIZATION_BASE_INCLUDE,
      });

      return res.status(201).json({ success: true, data: { organization: createdOrganization } });
    } catch (error) {
      await transaction.rollback();
      console.error('organizationController.createOrganization error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create organization.' });
    }
  },

  updateOrganization: async (req, res) => {
    try {
      const organization = await Organization.findByPk(req.params.id);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      const updates = {};
      const allowedFields = ['description', 'logo', 'website', 'contactEmail', 'locationId'];
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field] || null;
        }
      });

      if (req.body.type !== undefined) {
        if (!organizationService.ORGANIZATION_TYPES.includes(req.body.type)) {
          return res.status(400).json({ success: false, message: 'Invalid organization type.' });
        }
        updates.type = req.body.type;
      }

      if (req.body.name !== undefined) {
        if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
          return res.status(400).json({ success: false, message: 'Name must be a non-empty string.' });
        }
        updates.name = req.body.name.trim();
        updates.slug = await organizationService.generateSlug(updates.name, organization.id);
      }

      if (req.body.isPublic !== undefined) {
        const parsed = parseOptionalBoolean(req.body.isPublic);
        if (parsed === null) {
          return res.status(400).json({ success: false, message: 'isPublic must be a boolean.' });
        }
        updates.isPublic = parsed;
      }

      if (req.body.isVerified !== undefined) {
        const parsed = parseOptionalBoolean(req.body.isVerified);
        if (parsed === null) {
          return res.status(400).json({ success: false, message: 'isVerified must be a boolean.' });
        }
        updates.isVerified = parsed;
      }

      await organization.update(updates);

      const updatedOrganization = await Organization.findByPk(organization.id, {
        include: ORGANIZATION_BASE_INCLUDE,
      });

      return res.status(200).json({ success: true, data: { organization: updatedOrganization } });
    } catch (error) {
      console.error('organizationController.updateOrganization error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update organization.' });
    }
  },

  deleteOrganization: async (req, res) => {
    try {
      const organization = await Organization.findByPk(req.params.id, { attributes: ['id'] });
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      await organization.destroy();
      return res.status(200).json({ success: true, data: { deleted: true } });
    } catch (error) {
      console.error('organizationController.deleteOrganization error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete organization.' });
    }
  },

  getMembers: async (req, res) => {
    try {
      const organizationId = parsePositiveInt(req.params.id);
      if (!organizationId) {
        return res.status(400).json({ success: false, message: 'Invalid organization id.' });
      }

      const organization = await Organization.findByPk(organizationId, {
        attributes: ['id', 'isPublic'],
      });

      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      if (!organization.isPublic) {
        if (!req.user) {
          return res.status(403).json({ success: false, message: 'This organization\'s members are private.' });
        }

        const userId = req.user.id;
        const privileged = ['admin', 'moderator'].includes(req.user.role);

        if (!privileged) {
          const membership = await OrganizationMember.findOne({
            where: {
              organizationId: organization.id,
              userId,
              status: {
                [Op.in]: MEMBER_STATUSES,
              },
            },
            attributes: ['id'],
          });

          if (!membership) {
            return res.status(403).json({ success: false, message: 'This organization\'s members are private.' });
          }
        }
      }

      const members = await OrganizationMember.findAll({
        where: {
          organizationId: organization.id,
          status: {
            [Op.in]: MEMBER_STATUSES,
          },
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatar', 'avatarColor'],
          },
        ],
        order: [['createdAt', 'ASC']],
      });

      return res.status(200).json({ success: true, data: { members } });
    } catch (error) {
      console.error('organizationController.getMembers error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch members.' });
    }
  },

  joinOrganization: async (req, res) => {
    try {
      const organizationId = parsePositiveInt(req.params.id);
      if (!organizationId) {
        return res.status(400).json({ success: false, message: 'Invalid organization id.' });
      }

      const organization = await requireOrganizationById(organizationId);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      const existingMembership = await OrganizationMember.findOne({
        where: { organizationId, userId: req.user.id },
      });

      if (existingMembership) {
        return res.status(409).json({ success: false, message: 'You already have a membership for this organization.' });
      }

      const membership = await OrganizationMember.create({
        organizationId,
        userId: req.user.id,
        role: 'member',
        status: organization.isPublic ? 'active' : 'pending',
      });

      return res.status(201).json({ success: true, data: { membership } });
    } catch (error) {
      console.error('organizationController.joinOrganization error:', error);
      return res.status(500).json({ success: false, message: 'Failed to join organization.' });
    }
  },

  leaveOrganization: async (req, res) => {
    try {
      const organizationId = parsePositiveInt(req.params.id);
      if (!organizationId) {
        return res.status(400).json({ success: false, message: 'Invalid organization id.' });
      }

      const organization = await requireOrganizationById(organizationId, ['id']);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      const membership = await OrganizationMember.findOne({
        where: {
          organizationId,
          userId: req.user.id,
        },
      });

      if (!membership) {
        return res.status(404).json({ success: false, message: 'Membership not found.' });
      }

      if (membership.role === 'owner' && membership.status === 'active') {
        return res.status(403).json({ success: false, message: 'Owners cannot leave their organization.' });
      }

      await membership.destroy();
      return res.status(200).json({ success: true, data: { left: true } });
    } catch (error) {
      console.error('organizationController.leaveOrganization error:', error);
      return res.status(500).json({ success: false, message: 'Failed to leave organization.' });
    }
  },

  inviteMember: async (req, res) => {
    try {
      const organizationId = parsePositiveInt(req.params.id);
      const targetUserId = parsePositiveInt(req.body?.userId);

      if (!organizationId) {
        return res.status(400).json({ success: false, message: 'Invalid organization id.' });
      }

      if (!targetUserId) {
        return res.status(400).json({ success: false, message: 'Valid userId is required.' });
      }

      const organization = await requireOrganizationById(organizationId, ['id']);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      const canManage = await hasOrganizationManageAccess(organizationId, req.user);
      if (!canManage) {
        return res.status(403).json({ success: false, message: 'You do not have permission to manage members.' });
      }

      const targetUser = await User.findByPk(targetUserId, { attributes: ['id'] });
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const existingMembership = await OrganizationMember.findOne({
        where: { organizationId, userId: targetUserId },
      });
      if (existingMembership) {
        return res.status(409).json({ success: false, message: 'User already has a membership for this organization.' });
      }

      const membership = await OrganizationMember.create({
        organizationId,
        userId: targetUserId,
        role: 'member',
        status: 'invited',
        inviteToken: randomUUID(),
        invitedByUserId: req.user.id,
      });

      return res.status(201).json({ success: true, data: { membership } });
    } catch (error) {
      console.error('organizationController.inviteMember error:', error);
      return res.status(500).json({ success: false, message: 'Failed to invite member.' });
    }
  },

  approvePendingMember: async (req, res) => {
    try {
      const organizationId = parsePositiveInt(req.params.id);
      const targetUserId = parsePositiveInt(req.params.userId);

      if (!organizationId || !targetUserId) {
        return res.status(400).json({ success: false, message: 'Invalid organization or user id.' });
      }

      const organization = await requireOrganizationById(organizationId, ['id']);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      const canManage = await hasOrganizationManageAccess(organizationId, req.user);
      if (!canManage) {
        return res.status(403).json({ success: false, message: 'You do not have permission to manage members.' });
      }

      const membership = await OrganizationMember.findOne({
        where: {
          organizationId,
          userId: targetUserId,
          status: 'pending',
        },
      });

      if (!membership) {
        return res.status(404).json({ success: false, message: 'Pending membership not found.' });
      }

      await membership.update({ status: 'active' });
      return res.status(200).json({ success: true, data: { membership } });
    } catch (error) {
      console.error('organizationController.approvePendingMember error:', error);
      return res.status(500).json({ success: false, message: 'Failed to approve member.' });
    }
  },

  removeMember: async (req, res) => {
    try {
      const organizationId = parsePositiveInt(req.params.id);
      const targetUserId = parsePositiveInt(req.params.userId);

      if (!organizationId || !targetUserId) {
        return res.status(400).json({ success: false, message: 'Invalid organization or user id.' });
      }

      const organization = await requireOrganizationById(organizationId, ['id']);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      const canManage = await hasOrganizationManageAccess(organizationId, req.user);
      if (!canManage) {
        return res.status(403).json({ success: false, message: 'You do not have permission to manage members.' });
      }

      const membership = await OrganizationMember.findOne({
        where: {
          organizationId,
          userId: targetUserId,
        },
      });

      if (!membership) {
        return res.status(404).json({ success: false, message: 'Membership not found.' });
      }

      if (membership.role === 'owner' && membership.status === 'active') {
        return res.status(403).json({ success: false, message: 'Owners cannot be removed.' });
      }

      await membership.destroy();
      return res.status(200).json({ success: true, data: { removed: true } });
    } catch (error) {
      console.error('organizationController.removeMember error:', error);
      return res.status(500).json({ success: false, message: 'Failed to remove member.' });
    }
  },

  updateMemberRole: async (req, res) => {
    try {
      const organizationId = parsePositiveInt(req.params.id);
      const targetUserId = parsePositiveInt(req.params.userId);
      const nextRole = req.body?.role;

      if (!organizationId || !targetUserId) {
        return res.status(400).json({ success: false, message: 'Invalid organization or user id.' });
      }

      if (!ASSIGNABLE_MEMBER_ROLES.includes(nextRole)) {
        return res.status(400).json({ success: false, message: 'Invalid role.' });
      }

      const organization = await requireOrganizationById(organizationId, ['id']);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      const canManage = await hasOrganizationManageAccess(organizationId, req.user);
      if (!canManage) {
        return res.status(403).json({ success: false, message: 'You do not have permission to manage members.' });
      }

      const membership = await OrganizationMember.findOne({
        where: {
          organizationId,
          userId: targetUserId,
        },
      });

      if (!membership) {
        return res.status(404).json({ success: false, message: 'Membership not found.' });
      }

      if (membership.role === 'owner' && membership.status === 'active') {
        return res.status(403).json({ success: false, message: 'Owner role cannot be modified.' });
      }

      await membership.update({ role: nextRole });
      return res.status(200).json({ success: true, data: { membership } });
    } catch (error) {
      console.error('organizationController.updateMemberRole error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update member role.' });
    }
  },

  getPendingMembers: async (req, res) => {
    try {
      const organizationId = parsePositiveInt(req.params.id);
      if (!organizationId) {
        return res.status(400).json({ success: false, message: 'Invalid organization id.' });
      }

      const organization = await requireOrganizationById(organizationId, ['id']);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      const canManage = await hasOrganizationManageAccess(organizationId, req.user);
      if (!canManage) {
        return res.status(403).json({ success: false, message: 'You do not have permission to manage members.' });
      }

      const members = await OrganizationMember.findAll({
        where: {
          organizationId,
          status: 'pending',
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'avatar', 'avatarColor'],
          },
        ],
        order: [['createdAt', 'ASC']],
      });

      return res.status(200).json({ success: true, data: { members } });
    } catch (error) {
      console.error('organizationController.getPendingMembers error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch pending members.' });
    }
  },

  getOrgPolls: async (req, res) => {
    try {
      const organizationId = parsePositiveInt(req.params.id);
      if (!organizationId) {
        return res.status(400).json({ success: false, message: 'Invalid organization id.' });
      }

      const organization = await requireOrganizationById(organizationId, ['id', 'isPublic']);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      const memberAccess = req.user ? await isActiveMember(organizationId, req.user.id) : false;
      if (!organization.isPublic && !memberAccess) {
        return res.status(403).json({ success: false, message: 'Organization polls are members-only.' });
      }

      const where = { organizationId };
      if (!memberAccess) {
        where.visibility = 'public';
      }

      const polls = await Poll.findAll({
        where,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'avatar', 'avatarColor'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return res.status(200).json({
        success: true,
        data: {
          polls: polls.map(serializeOrgPoll),
        },
      });
    } catch (error) {
      console.error('organizationController.getOrgPolls error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch organization polls.' });
    }
  },

  createOrgPoll: async (req, res) => {
    try {
      const organizationId = parsePositiveInt(req.params.id);
      if (!organizationId) {
        return res.status(400).json({ success: false, message: 'Invalid organization id.' });
      }

      const organization = await requireOrganizationById(organizationId, ['id']);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      const memberAccess = await isActiveMember(organizationId, req.user.id);
      if (!memberAccess) {
        return res.status(403).json({ success: false, message: 'Only active members can create organization polls.' });
      }

      const titleResult = normalizeRequiredText(req.body?.title, 'Title', 5, 200);
      if (titleResult.error) {
        return res.status(400).json({ success: false, message: titleResult.error });
      }

      const visibilityResult = normalizeEnum(
        req.body?.visibility || 'members_only',
        ORG_CONTENT_VISIBILITIES,
        'Visibility'
      );
      if (visibilityResult.error) {
        return res.status(400).json({ success: false, message: visibilityResult.error });
      }

      let deadline = null;
      if (req.body?.deadline) {
        deadline = new Date(req.body.deadline);
        if (Number.isNaN(deadline.getTime())) {
          return res.status(400).json({ success: false, message: 'Deadline must be a valid date.' });
        }
      }

      const poll = await Poll.create({
        title: titleResult.value,
        description: req.body?.description || null,
        creatorId: req.user.id,
        organizationId,
        visibility: toOrgVisibility(visibilityResult.value),
        deadline,
      });

      return res.status(201).json({
        success: true,
        data: { poll: serializeOrgPoll(poll) },
      });
    } catch (error) {
      console.error('organizationController.createOrgPoll error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create organization poll.' });
    }
  },

  getOrgSuggestions: async (req, res) => {
    try {
      const organizationId = parsePositiveInt(req.params.id);
      if (!organizationId) {
        return res.status(400).json({ success: false, message: 'Invalid organization id.' });
      }

      const organization = await requireOrganizationById(organizationId, ['id', 'isPublic']);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      const memberAccess = req.user ? await isActiveMember(organizationId, req.user.id) : false;
      if (!organization.isPublic && !memberAccess) {
        return res.status(403).json({ success: false, message: 'Organization suggestions are members-only.' });
      }

      const where = { organizationId };
      if (!memberAccess) {
        where.visibility = 'public';
      }

      const suggestions = await Suggestion.findAll({
        where,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'avatar', 'avatarColor'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return res.status(200).json({
        success: true,
        data: {
          suggestions: suggestions.map(serializeOrgSuggestion),
        },
      });
    } catch (error) {
      console.error('organizationController.getOrgSuggestions error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch organization suggestions.' });
    }
  },

  createOrgSuggestion: async (req, res) => {
    try {
      const organizationId = parsePositiveInt(req.params.id);
      if (!organizationId) {
        return res.status(400).json({ success: false, message: 'Invalid organization id.' });
      }

      const organization = await requireOrganizationById(organizationId, ['id']);
      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      const memberAccess = await isActiveMember(organizationId, req.user.id);
      if (!memberAccess) {
        return res.status(403).json({ success: false, message: 'Only active members can create organization suggestions.' });
      }

      const titleResult = normalizeRequiredText(req.body?.title, 'Title', 5, 200);
      if (titleResult.error) {
        return res.status(400).json({ success: false, message: titleResult.error });
      }

      const bodyResult = normalizeRequiredText(req.body?.body, 'Body', 10, 10000);
      if (bodyResult.error) {
        return res.status(400).json({ success: false, message: bodyResult.error });
      }

      const typeResult = normalizeEnum(req.body?.type || 'idea', ORG_SUGGESTION_TYPES, 'Type');
      if (typeResult.error) {
        return res.status(400).json({ success: false, message: typeResult.error });
      }

      const visibilityResult = normalizeEnum(
        req.body?.visibility || 'members_only',
        ORG_CONTENT_VISIBILITIES,
        'Visibility'
      );
      if (visibilityResult.error) {
        return res.status(400).json({ success: false, message: visibilityResult.error });
      }

      const suggestion = await Suggestion.create({
        title: titleResult.value,
        body: bodyResult.value,
        type: typeResult.value,
        authorId: req.user.id,
        organizationId,
        visibility: toOrgVisibility(visibilityResult.value),
        voteRestriction: 'authenticated',
      });

      return res.status(201).json({
        success: true,
        data: { suggestion: serializeOrgSuggestion(suggestion) },
      });
    } catch (error) {
      console.error('organizationController.createOrgSuggestion error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create organization suggestion.' });
    }
  },
};

module.exports = organizationController;
