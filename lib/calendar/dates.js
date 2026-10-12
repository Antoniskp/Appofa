// Timed entries are instants plus an IANA zone. All-day entries are floating
// dates stored at UTC midnight with an exclusive end (the iCalendar convention).
export function localDateTime(value, timezone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function toInstant(local, timezone) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) throw new Error('Επίλεξε ημερομηνία και ώρα.');
  const naive = Date.parse(`${local}:00Z`);
  const offsets = new Set();
  // Probe both sides of a DST transition, including non-hour transitions.
  for (const hours of [-36, 0, 36]) {
    const probe = naive + hours * 3600000;
    offsets.add(Date.parse(`${localDateTime(probe, timezone)}:00Z`) - probe);
  }
  const candidates = [...offsets].map(offset => naive - offset)
    .filter(instant => localDateTime(instant, timezone) === local).sort((a, b) => a - b);
  if (!candidates.length) throw new Error('Αυτή η ώρα δεν υπάρχει λόγω αλλαγής θερινής ώρας. Επίλεξε άλλη ώρα.');
  if (candidates.length > 1) throw new Error('Αυτή η ώρα εμφανίζεται δύο φορές λόγω αλλαγής ώρας. Επίλεξε UTC ως ζώνη ώρας και καταχώρισε την αντίστοιχη ώρα UTC.');
  return new Date(candidates[0]).toISOString();
}

export function shiftDate(date, days) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
