const { benefits, calendarEntries } = require('../lib/benefits/catalog');
const source = require('../src/services/calendarSources/benefits');
const { eventToICalendar } = require('../lib/calendar/ical');

const query = { start: new Date('2026-11-01T00:00:00Z'), end: new Date('2026-12-10T00:00:00Z'), view: 'public' };

test('editorial dates carry traceable sources and unique all-day calendar identities', () => {
  const entries = calendarEntries();
  expect(new Set(entries.map(entry => entry.id)).size).toBe(entries.length);
  for (const entry of entries) {
    const item = benefits.find(benefit => entry.href.endsWith(`#${benefit.id}`));
    expect(item).toBeDefined();
    expect(item.dates.some(date => date.sourceUrl === entry.sourceUrl)).toBe(true);
    expect(new Date(entry.end) - new Date(entry.start)).toBe(86400000);
    expect(entry).toMatchObject({ allDay: true, timezone: 'Europe/Athens', category: 'benefits' });
  }
  expect(benefits.find(item => item.id === 'birth').dates).toEqual([]);
});

test('public benefit dates filter by overlap, category, location and view before counting', async () => {
  const result = await source.list(query);
  expect(result.data.length).toBeGreaterThan(0);
  expect(result.total).toBe(result.data.length);
  for (const values of [{ locationId: 1 }, { view: 'mine' }, { view: 'review' }, { categories: ['meeting', 'culture'] }]) {
    expect(await source.list({ ...query, ...values })).toEqual({ data: [], total: 0, canManage: false });
  }
  const day = await source.list({ ...query, start: new Date('2026-12-04T00:00:00Z'), end: new Date('2026-12-05T00:00:00Z'), categories: ['benefits', 'meeting'] });
  expect(day.data.map(entry => entry.sourceId)).toEqual(['heating:application-2026']);
  const after = await source.list({ ...query, start: new Date('2026-12-05T00:00:00Z'), end: new Date('2026-12-06T00:00:00Z') });
  expect(after.data).toEqual([]);
});

test('deadline remains upcoming throughout its day in Athens, then moves to past', async () => {
  const during = new Date('2026-12-04T21:59:59Z');
  const after = new Date('2026-12-04T22:00:00Z');
  const upcoming = await source.list({ ...query, start: during, period: 'upcoming' });
  expect(upcoming.data.some(entry => entry.sourceId === 'heating:application-2026')).toBe(true);
  const expired = await source.list({ ...query, start: after, period: 'upcoming' });
  expect(expired.data.some(entry => entry.sourceId === 'heating:application-2026')).toBe(false);
  const past = await source.list({ ...query, end: after, period: 'past' });
  expect(past.data.some(entry => entry.sourceId === 'heating:application-2026')).toBe(true);
  expect(past.data[0].sourceId).toBe('heating:application-2026');
});

test('date pagination preserves the total and does not invent future annual occurrences', async () => {
  const all = await source.list(query);
  const page = await source.list({ ...query, limit: 2, offset: 1 });
  expect(page.data).toEqual(all.data.slice(1, 3));
  expect(page.total).toBe(all.total);
  const future = await source.list({ ...query, start: new Date('2027-11-01T00:00:00Z'), end: new Date('2027-12-10T00:00:00Z') });
  expect(future.total).toBe(0);
});

test('benefit calendar exports keep a separate stable UID and exclusive end', () => {
  const entry = calendarEntries()[0];
  const ics = eventToICalendar({ ...entry, id: entry.sourceId, revision: 0, description: entry.sourceUrl });
  // Unfold before checking IDs, which can be longer than one iCalendar line.
  const unfolded = ics.replace(/\r\n /g, '');
  expect(unfolded).toContain(`UID:benefit-${entry.sourceId}@appofa`);
  expect(unfolded).toContain(`DTEND;VALUE=DATE:${entry.end.slice(0, 10).replaceAll('-', '')}`);
  expect(unfolded).not.toContain('UID:location-event-');
});
