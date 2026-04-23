'use strict';

const { Op } = require('sequelize');
const { Organization, OrganizationMember, User, Location, sequelize } = require('../models');
const organizationService = require('../services/organizationService');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

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
      const organization = await Organization.findByPk(req.params.id, {
        attributes: ['id', 'isPublic'],
      });

      if (!organization) {
        return res.status(404).json({ success: false, message: 'Organization not found.' });
      }

      if (!organization.isPublic) {
        const userId = req.user?.id;
        const privileged = req.user && ['admin', 'moderator'].includes(req.user.role);

        if (!userId && !privileged) {
          return res.status(403).json({ success: false, message: 'This organization\'s members are private.' });
        }

        if (!privileged) {
          const membership = await OrganizationMember.findOne({
            where: {
              organizationId: organization.id,
              userId,
              status: 'active',
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
            [Op.in]: ['active', 'invited', 'pending'],
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
};

module.exports = organizationController;
