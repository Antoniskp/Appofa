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

/**
 * Collect the ancestor location IDs for a given location (walking up parent_id).
 * @param {number|string} locationId
 * @param {boolean} includeSelf
 * @returns {Promise<number[]>}
 */
const getAncestorLocationIds = async (locationId, includeSelf = false) => {
  if (locationId === null || locationId === undefined) {
    return [];
  }

  const parsedLocationId = Number(locationId);
  if (!Number.isInteger(parsedLocationId) || parsedLocationId < 1) {
    return [];
  }

  const ancestorIds = includeSelf ? [parsedLocationId] : [];
  let currentId = parsedLocationId;

  while (currentId) {
    const location = await Location.findByPk(currentId, { attributes: ['id', 'parent_id'] });
    if (!location || !location.parent_id) break;
    ancestorIds.push(location.parent_id);
    currentId = location.parent_id;
  }

  return ancestorIds;
};

module.exports = {
  getDescendantLocationIds,
  getAncestorLocationIds
};
