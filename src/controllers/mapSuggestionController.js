const { Op } = require('sequelize');
const { Suggestion, Location } = require('../models');
const { getDescendantLocationIds } = require('../utils/locationUtils');

// Public, paginated map data is independent of the 50-item location feed. Only
// explicitly public fields are returned; anonymous authors never enter this API.
exports.list = async (req, res) => {
  const locationId = Number(req.query.locationId);
  if (!Number.isSafeInteger(locationId) || locationId < 1) {
    return res.status(400).json({ success: false, message: 'A valid location is required.' });
  }
  const { status, issueType, days, search, north, south, east, west } = req.query;
  const statuses = ['open', 'under_review', 'implemented', 'rejected'];
  const issueTypes = ['pothole', 'neglected_building', 'broken_lighting', 'sidewalk_access', 'trash', 'unsafe_crossing', 'flooding', 'illegal_dumping', 'graffiti_vandalism', 'abandoned_vehicle', 'noise', 'other'];
  if ((status && !statuses.includes(status)) || (issueType && !issueTypes.includes(issueType))
    || (days && !['7', '30', '90', '365'].includes(days)) || (search && (typeof search !== 'string' || search.length > 200))) {
    return res.status(400).json({ success: false, message: 'Invalid map filter.' });
  }
  const bounds = [north, south, east, west];
  const hasBounds = bounds.some(value => value !== undefined);
  if (hasBounds && (bounds.some(value => typeof value !== 'string' || !value.trim() || !Number.isFinite(Number(value)))
    || Math.abs(Number(north)) > 90 || Math.abs(Number(south)) > 90
    || Math.abs(Number(east)) > 180 || Math.abs(Number(west)) > 180 || Number(north) < Number(south))) {
    return res.status(400).json({ success: false, message: 'Invalid map bounds.' });
  }
  try {
    const ids = await getDescendantLocationIds(locationId, true);
    const where = { visibility: 'public', locationId: { [Op.in]: ids }, mapLat: { [Op.ne]: null }, mapLng: { [Op.ne]: null } };
    if (status) where.status = status;
    if (issueType) where.mapIssueType = issueType;
    if (days) where.createdAt = { [Op.gte]: new Date(Date.now() - Number(days) * 86400000) };
    if (search?.trim()) {
      const like = Suggestion.sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
      where[Op.and] = [{ [Op.or]: [{ title: { [like]: `%${search.trim()}%` } }, { body: { [like]: `%${search.trim()}%` } }] }];
    }
    if (hasBounds) {
      where.mapLat = { [Op.between]: [Number(south), Number(north)] };
      if (Number(west) <= Number(east)) where.mapLng = { [Op.between]: [Number(west), Number(east)] };
      else where[Op.and] = [...(where[Op.and] || []), { [Op.or]: [{ mapLng: { [Op.gte]: Number(west) } }, { mapLng: { [Op.lte]: Number(east) } }] }];
    }
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 100;
    const { count, rows } = await Suggestion.findAndCountAll({
      where, attributes: ['id', 'title', 'body', 'status', 'mapLat', 'mapLng', 'mapIssueType', 'createdAt', 'locationId'],
      include: [{ model: Location, as: 'location', attributes: ['id', 'name', 'name_local', 'slug'], required: false }],
      order: [['createdAt', 'DESC'], ['id', 'DESC']], limit, offset: (page - 1) * limit,
    });
    return res.json({ success: true, data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Map suggestions error:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to load map issues.' });
  }
};
