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

async function list({ start, end, locationId, descendants, view, category, limit, offset, period }, user) {
  const where = { start: { [Op.lt]: end }, end: { [Op.gt]: start } };
  // Expand around the cutoff for floating all-day dates, then compare those
  // against today's date in the event's own zone before counting/pagination.
  if (period === 'upcoming') where.end = { [Op.gt]: new Date(start.getTime() - 86400000) };
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
  const options = {
    where,
    attributes: { exclude: ['description', 'reviewNote', 'venue', 'organizer', 'sourceUrl'] },
    include: [{ model: Location, as: 'location', attributes: ['id', 'name', 'name_local', 'slug'] }],
    order: [['start', period === 'past' ? 'DESC' : 'ASC'], ['id', period === 'past' ? 'DESC' : 'ASC']],
  };
  if (period) {
    const cutoff = period === 'upcoming' ? start : end;
    const rows = (await LocationEvent.findAll(options)).filter(event => {
      if (!event.allDay) return period === 'upcoming' ? event.end > cutoff : event.end <= cutoff;
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
        timeZone: event.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
      }).formatToParts(cutoff).map(part => [part.type, part.value]));
      const today = `${parts.year}-${parts.month}-${parts.day}`;
      const ended = event.end.toISOString().slice(0, 10) <= today;
      return period === 'past' ? ended : !ended;
    });
    return { data: rows.slice(offset, limit == null ? undefined : offset + limit).map(toEntry), total: rows.length, canManage: allowed };
  }
  const { rows, count } = await LocationEvent.findAndCountAll({ ...options, limit, offset });
  return { data: rows.map(toEntry), total: count, canManage: allowed };
}

module.exports = { list };
