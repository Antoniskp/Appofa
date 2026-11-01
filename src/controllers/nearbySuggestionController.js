const { Op } = require('sequelize');
const { Suggestion } = require('../models');

function distanceMeters(lat, lng, otherLat, otherLng) {
  const rad = value => value * Math.PI / 180;
  const a = Math.sin(rad(otherLat - lat) / 2) ** 2
    + Math.cos(rad(lat)) * Math.cos(rad(otherLat)) * Math.sin(rad(otherLng - lng) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
}

exports.list = async (req, res) => {
  const { lat, lng } = req.query;
  if (typeof lat !== 'string' || !lat.trim() || typeof lng !== 'string' || !lng.trim()
    || !Number.isFinite(Number(lat)) || Math.abs(Number(lat)) > 90 || !Number.isFinite(Number(lng)) || Math.abs(Number(lng)) > 180) {
    return res.status(400).json({ success: false, message: 'Valid coordinates are required.' });
  }
  try {
    const rows = await Suggestion.findAll({
      where: {
        visibility: 'public', organizationId: null, type: 'problem',
        status: { [Op.in]: ['open', 'under_review'] },
        mapLat: { [Op.between]: [Number(lat) - 0.002, Number(lat) + 0.002] },
        mapLng: { [Op.ne]: null },
      },
      attributes: ['id', 'title', 'status', 'mapLat', 'mapLng', 'mapIssueType'],
    });
    const data = rows.map(row => ({ ...row.toJSON(), distance: Math.round(distanceMeters(Number(lat), Number(lng), Number(row.mapLat), Number(row.mapLng))) }))
      .filter(row => row.distance <= 200 && String(row.id) !== req.query.excludeId)
      .sort((a, b) => a.distance - b.distance || a.id - b.id).slice(0, 6);
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Unable to check nearby reports.' });
  }
};
exports.distanceMeters = distanceMeters;
