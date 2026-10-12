import { eventToICalendar } from '../lib/calendar/ical';
const event = { id: 42, revision: 2, title: 'Συνάντηση, στο πάρκο', description: 'First line\nSecond; line', venue: 'Town square', start: '2026-10-20T15:00:00.000Z', end: '2026-10-20T16:00:00.000Z', status: 'published', allDay: false };
test('exports stable identity, UTC instants and escaped text', () => {
  const ics = eventToICalendar(event);
  expect(ics).toContain('UID:location-event-42@appofa\r\n');
  expect(ics).toContain('DTSTART:20261020T150000Z');
  expect(ics).toContain('DESCRIPTION:First line\\nSecond\\; line');
  expect(ics).toContain('SUMMARY:Συνάντηση\\, στο πάρκο');
});
test('all-day cancellation preserves exclusive end and folds UTF-8 lines', () => {
  const ics = eventToICalendar({ ...event, title: 'Σ'.repeat(120), allDay: true, status: 'cancelled', start: '2026-10-20T00:00:00Z', end: '2026-10-21T00:00:00Z' });
  expect(ics).toContain('DTEND;VALUE=DATE:20261021');
  expect(ics).toContain('STATUS:CANCELLED');
  for (const line of ics.split('\r\n')) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
});
