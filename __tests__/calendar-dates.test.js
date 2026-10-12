import { localDateTime, toInstant, shiftDate } from '../lib/calendar/dates';

test('converts using the event timezone independently of the browser timezone', () => {
  expect(toInstant('2026-10-20T18:00', 'Europe/Athens')).toBe('2026-10-20T15:00:00.000Z');
  expect(toInstant('2026-12-20T18:00', 'Europe/Athens')).toBe('2026-12-20T16:00:00.000Z');
  expect(localDateTime('2026-10-20T15:00:00Z', 'Europe/Athens')).toBe('2026-10-20T18:00');
});
test('rejects nonexistent and ambiguous DST wall times', () => {
  expect(() => toInstant('2026-03-29T03:30', 'Europe/Athens')).toThrow();
  expect(() => toInstant('2026-10-25T03:30', 'Europe/Athens')).toThrow();
});
test('all-day end dates advance across month and year boundaries', () => {
  expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
  expect(shiftDate('2028-02-28', 1)).toBe('2028-02-29');
});
