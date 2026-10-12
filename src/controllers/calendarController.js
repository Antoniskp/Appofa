const { sequelize, LocationEvent, Location } = require('../models');
const { canManage } = require('../services/locationEventPermissions');
const { listEntries } = require('../services/calendarService');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const idOf = value => {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) fail(400, 'Invalid ID.');
  return Number(value);
};
const text = (value, max, required = false) => {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) fail(400, 'Invalid event text.');
  return value.trim();
};
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) fail(400, 'Use an ISO date with a timezone offset.');
  const calendarDate = value.slice(0, 10);
  if (new Date(`${calendarDate}T00:00:00Z`).toISOString().slice(0, 10) !== calendarDate || Number(value.slice(11, 13)) > 23) fail(400, 'Invalid date.');
  return new Date(value);
}
function validate(body) {
  const start = date(body.start), end = date(body.end);
  if (end <= start) fail(400, 'End must be after start.');
  if (typeof body.allDay !== 'boolean') fail(400, 'Invalid all-day setting.');
  const timezone = text(body.timezone, 100, true);
  try { new Intl.DateTimeFormat('en', { timeZone: timezone }).format(start); } catch { fail(400, 'Invalid timezone.'); }
  // All-day dates are floating calendar dates encoded as UTC midnight; end is exclusive.
  if (body.allDay && (start.toISOString().slice(11) !== '00:00:00.000Z' || end.toISOString().slice(11) !== '00:00:00.000Z')) fail(400, 'All-day events require whole dates.');
  const sourceUrl = text(body.sourceUrl, 2048);
  if (sourceUrl) {
    try { const url = new URL(sourceUrl); if (url.protocol !== 'https:' || url.username || url.password) throw new Error(); } catch { fail(400, 'Use an HTTPS link.'); }
  }
  if (!['community', 'meeting', 'culture', 'action', 'other'].includes(body.category)) fail(400, 'Invalid category.');
  return { title: text(body.title, 200, true), description: text(body.description, 10000, true), start, end, timezone, allDay: body.allDay,
    venue: text(body.venue, 500), organizer: text(body.organizer, 200), sourceUrl, category: body.category };
}
const handle = fn => async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  try { await fn(req, res); } catch (e) { if (!e.status) console.error('Calendar error:', e.message); res.status(e.status || 500).json({ success: false, message: e.status ? e.message : 'Unable to process event.' }); }
};
exports.list = handle(async (req, res) => {
  const start = date(req.query.start), end = date(req.query.end);
  if (end <= start || end - start > 370 * 86400000) fail(400, 'Choose a date range of up to one year.');
  const view = req.query.view || 'public';
  if (!['public', 'mine', 'review'].includes(view)) fail(400, 'Invalid view.');
  if (req.query.category && !['community', 'meeting', 'culture', 'action', 'other'].includes(req.query.category)) fail(400, 'Invalid category.');
  const page = Math.max(1, Math.min(100, parseInt(req.query.page, 10) || 1));
  const result = await listEntries({ start, end, view, page, source: req.query.source, category: req.query.category,
    locationId: req.query.locationId ? idOf(req.query.locationId) : null, descendants: req.query.descendants === 'true' }, req.user);
  res.json({ success: true, ...result });
});
exports.create = handle(async (req, res) => {
  const locationId = idOf(req.body.locationId);
  if (!await Location.findByPk(locationId)) fail(404, 'Location not found.');
  const values = validate(req.body);
  const data = await LocationEvent.create({ ...values, locationId, authorId: req.user.id, status: await canManage(req.user, locationId) ? 'published' : 'pending' });
  res.status(201).json({ success: true, data });
});
exports.detail = handle(async (req, res) => {
  const data = await LocationEvent.findByPk(idOf(req.params.id), { include: [{ model: Location, as: 'location', attributes: ['id', 'name', 'name_local', 'slug'] }] });
  if (!data) fail(404, 'Event not found.');
  const allowed = await canManage(req.user, data.locationId);
  if (!['published', 'cancelled'].includes(data.status) && data.authorId !== req.user?.id && !allowed) fail(404, 'Event not found.');
  res.json({ success: true, data, canManage: allowed, canEdit: allowed || data.authorId === req.user?.id });
});
exports.update = handle(async (req, res) => {
  const data = await sequelize.transaction(async transaction => {
    const event = await LocationEvent.findByPk(idOf(req.params.id), { transaction, lock: transaction.LOCK.UPDATE });
    if (!event) fail(404, 'Event not found.');
    const allowed = await canManage(req.user, event.locationId);
    if (!allowed && event.authorId !== req.user.id) fail(403, 'You cannot change this event.');
    if (req.body.revision !== event.revision) fail(409, 'Event changed. Refresh and try again.');
    let values;
    if (req.body.action) {
      if (!['publish', 'reject', 'cancel'].includes(req.body.action)) fail(400, 'Invalid action.');
      if (req.body.action !== 'cancel' && !allowed) fail(403, 'Moderator approval required.');
      if (req.body.action !== 'cancel' && event.status !== 'pending') fail(409, 'Only pending events can be reviewed.');
      if (req.body.action === 'cancel' && event.status !== 'published') fail(409, 'Only published events can be cancelled.');
      values = { status: { publish: 'published', reject: 'rejected', cancel: 'cancelled' }[req.body.action] };
    } else { values = { ...validate(req.body), status: allowed ? 'published' : 'pending' }; }
    return event.update({ ...values, revision: event.revision + 1 }, { transaction });
  });
  res.json({ success: true, data });
});
