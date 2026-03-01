/**
 * Shared utilities for location-related operations
 */

const { Op } = require('sequelize');
const { Location } = require('../models');

/**
 * Collect all descendant location IDs for a given root location.
 * @param {number|string} rootId - The ID of the root location
 * @param {boolean} includeSelf - Whether to include the root ID in the result
 * @returns {Promise<number[]>} Array of descendant location IDs
 */
const getDescendantLocationIds = async (rootId, includeSelf = false) => {
  const descendantIds = includeSelf ? [rootId] : [];
  let queue = [rootId];

  while (queue.length > 0) {
    const children = await Location.findAll({
      where: { parent_id: { [Op.in]: queue } },
      attributes: ['id']
    });

    const childIds = children.map((child) => child.id);
    if (childIds.length === 0) {
      break;
    }

    descendantIds.push(...childIds);
    queue = childIds;
  }

  return descendantIds;
};

module.exports = {
  getDescendantLocationIds
};
