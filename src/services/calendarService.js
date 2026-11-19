const { calendarEntryDays } = require('../../lib/calendar/dates');

// Entries are projections of source records, never a second copy of them.
// Each provider owns its visibility rules and returns the common entry shape.
const sources = {
  'location-event': require('./calendarSources/locationEvents'),
  benefit: require('./calendarSources/benefits'),
  'poll-deadline': require('./calendarSources/pollDeadlines'),
  election: require('./calendarSources/elections'),
};
const PAGE_SIZE = 100;
const DAY = 86400000;

async function listEntries(query, user) {
  const selected = query.source ? [query.source] : Object.keys(sources);
  if (selected.some(source => !Object.hasOwn(sources, source))) {
    throw Object.assign(new Error('Unknown calendar source.'), { status: 400 });
  }
  const offset = (query.page - 1) * PAGE_SIZE;
  const combined = selected.length > 1;
  const results = await Promise.all(selected.map(source => sources[source].list({
    ...query, limit: query.complete ? undefined : combined ? offset + PAGE_SIZE : PAGE_SIZE,
    offset: query.complete || combined ? 0 : offset,
  }, user)));
  const total = results.reduce((sum, result) => sum + result.total, 0);
  const direction = query.period === 'past' ? -1 : 1;
  const entries = results.flatMap(result => result.data).sort((a, b) =>
    direction * (new Date(a.start) - new Date(b.start) || a.id.localeCompare(b.id, 'en', { numeric: true })));
  return {
    data: combined && !query.complete ? entries.slice(offset, offset + PAGE_SIZE) : entries,
    canManage: results.some(result => result.canManage),
    pagination: { page: query.complete ? 1 : query.page, totalPages: query.complete ? (total ? 1 : 0) : Math.ceil(total / PAGE_SIZE), total },
  };
}

async function findNextEventDay(from, query, user) {
  // Look ahead up to one year using complete windows. Buffer the UTC range
  // on both sides, then compare each entry by its displayed calendar dates.
  const first = from.getTime();
  const horizon = Math.min(first + 365 * DAY, Date.UTC(10000, 0, 1));
  for (let cursor = first; cursor < horizon; cursor += 31 * DAY) {
    const until = Math.min(cursor + 31 * DAY, horizon);
    const firstDay = new Date(cursor).toISOString().slice(0, 10);
    const lastDay = new Date(until - DAY).toISOString().slice(0, 10);
    const { data } = await listEntries({
      ...query, start: new Date(cursor - DAY), end: new Date(until + DAY), complete: true, page: 1,
    }, user);
    let next = null;
    for (const entry of data) {
      if (entry.status === 'cancelled') continue;
      const days = calendarEntryDays(entry);
      const candidate = days.firstDay < firstDay ? firstDay : days.firstDay;
      if (days.lastDay >= candidate && candidate <= lastDay && (next === null || candidate < next)) next = candidate;
    }
    if (next) return next;
  }
  return null;
}

module.exports = { listEntries, findNextEventDay };
