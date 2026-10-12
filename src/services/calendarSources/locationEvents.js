const { Op } = require('sequelize');
const { LocationEvent, Location } = require('../../models');
const { getDescendantLocationIds } = require('../../utils/locationUtils');
const { canManage } = require('../locationEventPermissions');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };

function toEntry(event) {
  return {
    id: `location-event:${event.id}`, source: 'location-event', sourceId: event.id,
    title: event.title, start: event.start, end: event.end, allDay: event.allDay,
    timezone: event.timezone, locationId: event.locationId, location: event.location,
    status: event.status, category: event.category, href: `/events/${event.id}`,
  };
}

async function list({ start, end, locationId, descendants, view, category, limit, offset }, user) {
  const where = { start: { [Op.lt]: end }, end: { [Op.gt]: start } };
  let allowed = false;
  if (locationId) {
    if (!await Location.findByPk(locationId)) fail(404, 'Location not found.');
    allowed = await canManage(user, locationId);
    where.locationId = descendants ? { [Op.in]: await getDescendantLocationIds(locationId, true) } : locationId;
  }
  if (category) where.category = category;
  if (view === 'public') where.status = { [Op.in]: ['published', 'cancelled'] };
  else if (view === 'mine') {
    if (!user) fail(401, 'Please sign in.');
    where.authorId = user.id;
  } else if (view === 'review') {
    if (!allowed) fail(403, 'Select a location you moderate.');
    where.status = 'pending';
  }
  const { rows, count } = await LocationEvent.findAndCountAll({
    where,
    include: [{ model: Location, as: 'location', attributes: ['id', 'name', 'name_local', 'slug'] }],
    order: [['start', 'ASC'], ['id', 'ASC']], limit, offset,
  });
  return { data: rows.map(toEntry), total: count, canManage: allowed };
}

module.exports = { list };
