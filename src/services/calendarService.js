// Entries are projections of source records, never a second copy of them.
// Each provider owns its visibility rules and returns the common entry shape.
const sources = { 'location-event': require('./calendarSources/locationEvents') };
const PAGE_SIZE = 100;

async function listEntries(query, user) {
  const selected = query.source ? [query.source] : Object.keys(sources);
  if (selected.some(source => !Object.hasOwn(sources, source))) {
    throw Object.assign(new Error('Unknown calendar source.'), { status: 400 });
  }
  const offset = (query.page - 1) * PAGE_SIZE;
  const combined = selected.length > 1;
  const results = await Promise.all(selected.map(source => sources[source].list({
    ...query, limit: combined ? offset + PAGE_SIZE : PAGE_SIZE, offset: combined ? 0 : offset,
  }, user)));
  const total = results.reduce((sum, result) => sum + result.total, 0);
  const entries = results.flatMap(result => result.data).sort((a, b) =>
    new Date(a.start) - new Date(b.start) || a.id.localeCompare(b.id, 'en', { numeric: true }));
  return {
    data: combined ? entries.slice(offset, offset + PAGE_SIZE) : entries,
    canManage: results.some(result => result.canManage),
    pagination: { page: query.page, totalPages: Math.ceil(total / PAGE_SIZE), total },
  };
}

module.exports = { listEntries };
