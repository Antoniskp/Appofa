const { Op } = require('sequelize');
const { sequelize, Location, LocationImprovement, User, UserLocationRole } = require('../models');
const { getAncestorLocationIds } = require('../utils/locationUtils');

const FIELDS = ['description', 'name_local', 'population_override', 'wikipedia_url'];
const KINDS = ['addition', 'correction', 'source'];
const valueOf = (location, field) => String((field === 'population_override' ? location.population_override ?? location.population : location[field]) ?? '');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const idOf = value => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) fail(400, 'Invalid ID.');
  return id;
};
const text = (value, max, required = false) => {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) fail(400, 'Invalid contribution text.');
  return value.trim();
};
function httpsUrl(value) {
  const result = text(value, 2048);
  if (!result) return null;
  try {
    const url = new URL(result);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
  } catch { fail(400, 'Please use a valid HTTPS source link.'); }
  return result;
}
function validate(body) {
  if (!FIELDS.includes(body.field) || !KINDS.includes(body.kind)) fail(400, 'Invalid contribution category or field.');
  const maxLength = body.field === 'name_local' ? 255 : body.field === 'wikipedia_url' ? 500 : 5000;
  let proposedValue = text(body.proposedValue, maxLength, true);
  if (body.field === 'population_override') {
    if (!/^\d+$/.test(proposedValue) || Number(proposedValue) > 2147483647) fail(400, 'Population must be a non-negative whole number.');
    proposedValue = String(Number(proposedValue));
  }
  if (body.field === 'wikipedia_url') {
    proposedValue = httpsUrl(proposedValue);
    if (!new URL(proposedValue).hostname.endsWith('.wikipedia.org')) fail(400, 'Please use a Wikipedia link.');
  }
  const sourceUrl = httpsUrl(body.sourceUrl);
  if (body.kind === 'source' && !sourceUrl) fail(400, 'A source link is required for this contribution.');
  return { field: body.field, kind: body.kind, proposedValue, sourceUrl, note: text(body.note, 2000) };
}
async function canReview(user, locationId) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'moderator') return false;
  const ancestors = await getAncestorLocationIds(locationId, true);
  return !!await UserLocationRole.findOne({ where: { userId: user.id, roleKey: 'moderator', locationId: { [Op.in]: ancestors } } });
}
const handle = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (error) {
    if (!error.status) console.error('Location improvement error:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Unable to process this contribution.' });
  }
};

exports.list = handle(async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  const locationId = idOf(req.params.locationId);
  if (!await Location.findByPk(locationId)) fail(404, 'Location not found.');
  const allowed = await canReview(req.user, locationId);
  const view = req.query.view || 'history';
  const where = { locationId };
  if (view === 'history') where.status = 'accepted';
  else if (view === 'mine') {
    if (!req.user) fail(401, 'Please sign in.');
    where.authorId = req.user.id;
  } else if (view === 'review') {
    if (!allowed) fail(403, 'This location is outside your review permissions.');
    where.status = { [Op.in]: ['pending', 'needs_clarification'] };
  } else fail(400, 'Invalid view.');
  const page = Math.min(10000, Math.max(1, parseInt(req.query.page, 10) || 1));
  const { rows, count } = await LocationImprovement.findAndCountAll({
    where, include: [{ model: User, as: 'author', attributes: ['username'] }],
    order: [[view === 'history' ? 'reviewedAt' : 'createdAt', 'DESC'], ['id', 'DESC']],
    limit: 10, offset: (page - 1) * 10,
  });
  const data = rows.map(row => {
    const item = row.toJSON();
    if (view === 'history') { delete item.note; delete item.reviewNote; delete item.authorId; delete item.reviewerId; }
    return item;
  });
  res.json({ success: true, data, canReview: allowed, pagination: { page, totalPages: Math.ceil(count / 10) } });
});

exports.create = handle(async (req, res) => {
  const locationId = idOf(req.params.locationId);
  const location = await Location.findByPk(locationId);
  if (!location) fail(404, 'Location not found.');
  const values = validate(req.body);
  const data = await LocationImprovement.create({ ...values, locationId, authorId: req.user.id, originalValue: valueOf(location, values.field) });
  res.status(201).json({ success: true, data });
});

exports.revise = handle(async (req, res) => {
  const locationId = idOf(req.params.locationId);
  const id = idOf(req.params.id);
  const values = validate(req.body);
  const data = await sequelize.transaction(async transaction => {
    const item = await LocationImprovement.findOne({ where: { id, locationId }, transaction, lock: transaction.LOCK.UPDATE });
    if (!item) fail(404, 'Contribution not found.');
    if (item.authorId !== req.user.id) fail(403, 'Only the contributor can revise this submission.');
    if (item.status !== 'needs_clarification' || item.revision !== req.body.revision) fail(409, 'This contribution changed. Refresh and try again.');
    const location = await Location.findByPk(locationId, { transaction });
    return item.update({ ...values, originalValue: valueOf(location, values.field), status: 'pending', revision: item.revision + 1 }, { transaction });
  });
  res.json({ success: true, data });
});

exports.review = handle(async (req, res) => {
  const locationId = idOf(req.params.locationId);
  const id = idOf(req.params.id);
  if (!await canReview(req.user, locationId)) fail(403, 'This location is outside your review permissions.');
  const { status, revision } = req.body;
  if (!['accepted', 'declined', 'needs_clarification'].includes(status)) fail(400, 'Invalid review decision.');
  const reviewNote = text(req.body.reviewNote, 2000, status !== 'accepted');
  const data = await sequelize.transaction(async transaction => {
    const item = await LocationImprovement.findOne({ where: { id, locationId }, transaction, lock: transaction.LOCK.UPDATE });
    if (!item) fail(404, 'Contribution not found.');
    if (item.status !== 'pending' || item.revision !== revision) fail(409, 'This contribution changed. Refresh and try again.');
    if (status === 'accepted') {
      const location = await Location.findByPk(locationId, { transaction, lock: transaction.LOCK.UPDATE });
      if (valueOf(location, item.field) !== item.originalValue) fail(409, 'The page has changed. Ask the contributor to revise against the current information.');
      const values = validate(item.toJSON());
      const changes = { [item.field]: item.field === 'population_override' ? Number(values.proposedValue) : values.proposedValue };
      if (item.field === 'wikipedia_url' && location.wikipedia_url !== values.proposedValue) {
        // Do not retain an image or population fetched from a different article.
        Object.assign(changes, { wikipedia_image_url: null, population: null, wikipedia_data_updated_at: null });
      }
      await location.update(changes, { transaction });
    }
    return item.update({ status, reviewNote, reviewerId: req.user.id, reviewedAt: new Date(), revision: item.revision + 1 }, { transaction });
  });
  res.json({ success: true, data });
});
