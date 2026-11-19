const { Op } = require('sequelize');
const { Location, LocationLink, Poll } = require('../../models');
const { getDescendantLocationIds } = require('../../utils/locationUtils');

async function list({ start, end, locationId, descendants, view, category, limit, offset, period }) {
  if (view !== 'public' || (category && category !== 'polls')) {
    return { data: [], total: 0 };
  }

  const where = {
    visibility: 'public',
    deadline: { [Op.gte]: start, [Op.lt]: end },
    [Op.or]: [
      { status: 'active' },
      // A poll closed early no longer has an upcoming closing time.
      { status: 'closed', deadline: { [Op.lte]: new Date() } },
    ],
  };

  if (locationId) {
    const scope = descendants ? await getDescendantLocationIds(locationId, true) : [locationId];
    const links = await LocationLink.findAll({
      where: { entity_type: 'poll', location_id: { [Op.in]: scope } },
      attributes: ['entity_id'],
      raw: true,
    });
    where[Op.and] = {
      [Op.or]: [
        { locationId: { [Op.in]: scope } },
        { id: { [Op.in]: links.map(link => link.entity_id) } },
      ],
    };
  }

  const direction = period === 'past' ? 'DESC' : 'ASC';
  const options = {
    where,
    attributes: ['id', 'title', 'deadline', 'locationId'],
    include: [{ model: Location, as: 'location', attributes: ['id', 'name', 'name_local', 'slug'] }],
    order: [['deadline', direction], ['id', direction]],
    limit,
    offset,
  };
  const { rows, count } = limit == null
    ? { rows: await Poll.findAll(options) }
    : await Poll.findAndCountAll(options);

  return {
    data: rows.map(poll => ({
      id: `poll-deadline:${poll.id}`, source: 'poll-deadline', sourceId: poll.id,
      title: poll.title, start: poll.deadline, end: new Date(poll.deadline.getTime() + 1),
      allDay: false, timezone: 'UTC', category: 'polls', href: `/polls/${poll.id}`,
      locationId: poll.locationId, location: poll.location,
    })),
    total: count ?? rows.length,
  };
}

module.exports = { list };
