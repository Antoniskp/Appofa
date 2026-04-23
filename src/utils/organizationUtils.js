const { Op } = require('sequelize');
const { OrganizationMember } = require('../models');

const ORG_ADMIN_ROLES = ['owner', 'admin'];
const PLATFORM_PRIVILEGED_ROLES = ['admin', 'moderator'];

async function isActiveMember(organizationId, userId) {
  if (!organizationId || !userId) return false;

  const membership = await OrganizationMember.findOne({
    where: {
      organizationId,
      userId,
      status: 'active',
    },
    attributes: ['id'],
  });

  return !!membership;
}

async function isOrgAdmin(organizationId, userId, userRole) {
  if (PLATFORM_PRIVILEGED_ROLES.includes(userRole)) {
    return true;
  }

  if (!organizationId || !userId) return false;

  const membership = await OrganizationMember.findOne({
    where: {
      organizationId,
      userId,
      status: 'active',
      role: {
        [Op.in]: ORG_ADMIN_ROLES,
      },
    },
    attributes: ['id'],
  });

  return !!membership;
}

module.exports = {
  isActiveMember,
  isOrgAdmin,
};
