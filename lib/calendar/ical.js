const escapeText = value => String(value || '').replace(/\\/g, '\\\\')
  .replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
const timestamp = value => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

function fold(line) {
  let result = '', bytes = 0;
  for (const character of line) {
    const size = new TextEncoder().encode(character).length;
    if (bytes + size > 75) { result += '\r\n '; bytes = 1; }
    result += character;
    bytes += size;
  }
  return result;
}

export function eventToICalendar(event, now = new Date()) {
  const dateValue = value => value.slice(0, 10).replace(/-/g, '');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Appofa//Calendar//EL',
    'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:location-event-${event.id}@appofa`,
    `DTSTAMP:${timestamp(now)}`, `SEQUENCE:${event.revision}`,
    `SUMMARY:${escapeText(event.title)}`, `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.venue)}`,
    `STATUS:${event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
    event.allDay ? `DTSTART;VALUE=DATE:${dateValue(event.start)}` : `DTSTART:${timestamp(event.start)}`,
    event.allDay ? `DTEND;VALUE=DATE:${dateValue(event.end)}` : `DTEND:${timestamp(event.end)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].map(fold).join('\r\n') + '\r\n';
}
