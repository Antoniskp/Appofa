const { Op } = require('sequelize');
const { UserLocationRole } = require('../models');
const { getAncestorLocationIds } = require('../utils/locationUtils');

async function canManage(user, locationId) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'moderator') return false;
  return !!await UserLocationRole.findOne({
    where: {
      userId: user.id, roleKey: 'moderator',
      locationId: { [Op.in]: await getAncestorLocationIds(locationId, true) },
    },
  });
}

module.exports = { canManage };
