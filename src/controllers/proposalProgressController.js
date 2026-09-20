const { updateProgress } = require('../services/proposalProgressService');
const { Suggestion, Location } = require('../models');
const { Op } = require('sequelize');

exports.list = async (req, res) => {
  try {
    const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
    const { rows, count } = await Suggestion.findAndCountAll({
      where: { visibility: 'public', organizationId: null, progress: { [Op.ne]: null } },
      attributes: ['id', 'title', 'status', 'progress', 'updatedAt'],
      include: [{ model: Location, as: 'location', attributes: ['name', 'slug'] }],
      order: [['updatedAt', 'DESC'], ['id', 'DESC']], limit: 12, offset: (page - 1) * 12,
    });
    res.json({ success: true, data: rows, pagination: { currentPage: page, totalPages: Math.ceil(count / 12) } });
  } catch {
    res.status(500).json({ success: false, message: 'Unable to load progress.' });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ success: false, message: 'Invalid proposal ID.' });
    const data = await updateProgress(id, req.user, req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Unable to update progress.' });
  }
};
