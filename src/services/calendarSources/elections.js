const { localDateTime, shiftDate } = require('../../../lib/calendar/dates');

const timezone = 'Europe/Athens';
const elections = [
  {
    id: 'gr-parliament-2023-06',
    date: '2023-06-25',
    titles: {
      el: 'Βουλευτικές εκλογές στην Ελλάδα',
      en: 'Greek parliamentary election',
      ro: 'Alegeri parlamentare în Grecia',
    },
    href: 'https://www.ypes.gr/lipsi-archeion-apotelesmaton-ethnikon-eklogon/archeia-apotelesmaton-ethnikon-eklogon-25is-iouniou-2023/',
  },
  {
    id: 'gr-european-parliament-2024',
    date: '2024-06-09',
    titles: {
      el: 'Ευρωεκλογές στην Ελλάδα',
      en: 'European Parliament election in Greece',
      ro: 'Alegeri pentru Parlamentul European în Grecia',
    },
    href: 'https://results.elections.europa.eu/en/greece/',
  },
];

const entries = elections.map(({ id, date, titles, href }) => ({
  id: `election:${id}`, source: 'election', sourceId: id, title: titles.el, titles,
  start: `${date}T00:00:00.000Z`, end: `${shiftDate(date, 1)}T00:00:00.000Z`,
  allDay: true, timezone, category: 'elections', href,
}));

async function list({ start, end, locationId, view, categories, selection, limit, offset = 0, period }) {
  const filteredCategories = selection?.categories ?? categories;
  if (locationId || view !== 'public' || (filteredCategories && !filteredCategories.includes('elections'))) {
    return { data: [], total: 0 };
  }

  const cutoff = period ? localDateTime(period === 'past' ? end : start, timezone).slice(0, 10) : null;
  const rows = entries.filter(entry => {
    if (period === 'upcoming') return entry.end.slice(0, 10) > cutoff && new Date(entry.start) < end;
    if (period === 'past') return entry.end.slice(0, 10) <= cutoff && new Date(entry.end) > start;
    return new Date(entry.start) < end && new Date(entry.end) > start;
  });
  if (period === 'past') rows.reverse();
  return { data: rows.slice(offset, limit == null ? undefined : offset + limit), total: rows.length };
}

module.exports = { list };
