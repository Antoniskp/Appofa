const { Op } = require('sequelize');
const { Poll, Suggestion } = require('../models');
const IssueFollow = require('../models/IssueFollow');

// Following is deliberately limited to public, non-organization content.
// Recheck on every read: a later privacy change must not expose the target.
const publicWhere = { visibility: 'public', organizationId: null };
const models = { poll: Poll, suggestion: Suggestion };
async function target(req, res) {
  const { entityType } = req.params;
  const entityId = Number(req.params.entityId);
  if (!Object.hasOwn(models, entityType) || !Number.isSafeInteger(entityId) || entityId < 1) {
    res.status(400).json({ success: false, message: 'Invalid issue.' });
    return null;
  }
  const item = await models[entityType].findOne({ where: { id: entityId, ...publicWhere }, attributes: ['id'] });
  if (!item) { res.status(404).json({ success: false, message: 'This public issue is unavailable.' }); return null; }
  return { userId: req.user.id, entityType, entityId };
}
exports.status = async (req, res) => {
  try {
    const where = await target(req, res);
    if (!where) return;
    res.json({ success: true, data: { following: Boolean(await IssueFollow.findOne({ where })) } });
  } catch { res.status(500).json({ success: false, message: 'Unable to load follow status.' }); }
};
exports.set = async (req, res) => {
  try {
    if (typeof req.body.following !== 'boolean') return res.status(400).json({ success: false, message: 'following must be a boolean.' });
    const where = await target(req, res);
    if (!where) return;
    if (req.body.following) await IssueFollow.findOrCreate({ where });
    else await IssueFollow.destroy({ where });
    res.json({ success: true, data: { following: req.body.following } });
  } catch { res.status(500).json({ success: false, message: 'Unable to update follow status.' }); }
};
exports.list = async (req, res) => {
  try {
    const page = Math.max(1, Math.min(10000, parseInt(req.query.page, 10) || 1));
    const { rows, count } = await IssueFollow.findAndCountAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC'], ['id', 'DESC']], limit: 20, offset: (page - 1) * 20 });
    const results = await Promise.all(Object.entries(models).map(async ([entityType, model]) => {
      const ids = rows.filter(row => row.entityType === entityType).map(row => row.entityId);
      if (!ids.length) return [];
      const items = await model.findAll({ where: { ...publicWhere, id: { [Op.in]: ids } }, attributes: ['id', 'title', 'status', 'updatedAt', ...(entityType === 'suggestion' ? ['progress'] : ['deadline'])] });
      return items.map(item => ({ ...item.toJSON(), entityType }));
    }));
    res.json({ success: true, data: results.flat().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)), pagination: { currentPage: page, totalPages: Math.max(1, Math.ceil(count / 20)) } });
  } catch { res.status(500).json({ success: false, message: 'Unable to load followed issues.' }); }
};
