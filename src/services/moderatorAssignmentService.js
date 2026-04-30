const { ModeratorAssignment, Location } = require('../models');

async function getModeratorAssignment(userId, options = {}) {
  if (!userId) return null;
  return ModeratorAssignment.findOne({
    where: { userId },
    attributes: ['id', 'userId', 'locationId', 'assignedByUserId', 'createdAt', 'updatedAt'],
    include: [
      {
        model: Location,
        as: 'location',
        attributes: ['id', 'name', 'type', 'slug'],
        required: false
      }
    ],
    ...options
  });
}

async function getModeratorLocationId(userId, options = {}) {
  if (!userId) return null;
  const assignment = await ModeratorAssignment.findOne({
    where: { userId },
    attributes: ['locationId'],
    ...options
  });
  return assignment?.locationId || null;
}

function serializeUserModeratorFields(userRecord) {
  const plain = userRecord?.toJSON ? userRecord.toJSON() : { ...(userRecord || {}) };
  const location = plain?.moderatorAssignment?.location || null;
  return {
    ...plain,
    moderatorLocationId: plain?.moderatorAssignment?.locationId || null,
    moderatorLocation: location
      ? {
          id: location.id,
          name: location.name,
          type: location.type,
          slug: location.slug
        }
      : null
  };
}

module.exports = {
  getModeratorAssignment,
  getModeratorLocationId,
  serializeUserModeratorFields
};
