const { calendarEntries } = require('../../../lib/benefits/catalog');

async function list({ start, end, locationId, view, category, limit, offset = 0, period }) {
  // National editorial dates have no author or moderation queue and must not
  // appear in a location's events tab or in a member's personal submissions.
  if (locationId || view !== 'public' || (category && category !== 'benefits')) {
    return { data: [], total: 0, canManage: false };
  }
  const athensDate = value => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(value);
  const cutoff = period ? athensDate(period === 'past' ? end : start) : null;
  const rows = calendarEntries().filter(entry => {
    if (period === 'upcoming') return entry.end.slice(0, 10) > cutoff && new Date(entry.start) < end;
    if (period === 'past') return entry.end.slice(0, 10) <= cutoff && new Date(entry.end) > start;
    return new Date(entry.start) < end && new Date(entry.end) > start;
  }).sort((a, b) => (period === 'past' ? -1 : 1) * (a.start.localeCompare(b.start) || a.id.localeCompare(b.id)));
  return { data: rows.slice(offset, limit == null ? undefined : offset + limit), total: rows.length, canManage: false };
}

module.exports = { list };
