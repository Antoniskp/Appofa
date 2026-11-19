const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { sequelize, User, Location, UserLocationRole, LocationEvent, Notification, Poll, LocationLink } = require('../src/models');
jest.mock('../src/services/pushService', () => ({ getUnreadCount: jest.fn().mockResolvedValue(1), sendPushToUser: jest.fn().mockResolvedValue({}) }));
const { storeCsrfToken } = require('../src/utils/csrf');
const app = express();
app.use(express.json());
app.use('/api/calendar', require('../src/routes/calendarRoutes'));
let author, moderator, outsider, parent, town;
const payload = { title: 'Community meeting', description: 'Discuss the park.', start: '2026-10-20T18:00:00+03:00', end: '2026-10-20T19:00:00+03:00', timezone: 'Europe/Athens', allDay: false, category: 'meeting' };
const range = 'start=2026-10-01T00:00:00Z&end=2026-11-01T00:00:00Z';
const headers = user => {
  const csrf = `calendar-csrf-${user.id}`;
  storeCsrfToken(csrf, user.id);
  return { Authorization: `Bearer ${jwt.sign({ id: user.id, sessionVersion: user.sessionVersion }, process.env.JWT_SECRET)}`, Cookie: `csrf_token=${csrf}`, 'x-csrf-token': csrf };
};
const create = (actor = author, values = {}) => request(app).post('/api/calendar/events').set(headers(actor)).send({ ...payload, locationId: town.id, ...values });
const update = (id, actor, body) => request(app).patch(`/api/calendar/events/${id}`).set(headers(actor)).send(body);
beforeAll(async () => {
  await sequelize.sync({ force: true });
  parent = await Location.create({ name: 'Parent', slug: 'calendar-parent', type: 'country' });
  town = await Location.create({ name: 'Town', slug: 'calendar-town', type: 'municipality', parent_id: parent.id });
  author = await User.create({ username: 'cal-author', email: 'cal-author@example.test', password: 'Password123!', role: 'viewer', isVerified: true });
  moderator = await User.create({ username: 'cal-mod', email: 'cal-mod@example.test', password: 'Password123!', role: 'moderator', isVerified: true });
  outsider = await User.create({ username: 'cal-other', email: 'cal-other@example.test', password: 'Password123!', role: 'moderator', isVerified: true, homeLocationId: town.id });
  await UserLocationRole.create({ userId: moderator.id, locationId: parent.id, roleKey: 'moderator' });
});
beforeEach(async () => {
  await Notification.destroy({ where: {} });
  await LocationEvent.destroy({ where: {} });
  await Poll.destroy({ where: {} });
  await LocationLink.destroy({ where: { entity_type: 'poll' } });
});
afterAll(() => sequelize.close());

test('mutations require authentication and CSRF', async () => {
  expect((await request(app).post('/api/calendar/events').send(payload)).status).toBe(401);
  const auth = headers(author); delete auth['x-csrf-token'];
  expect((await request(app).post('/api/calendar/events').set(auth).send(payload)).status).toBe(403);
});
test('pending records are private and cannot forge publishing or ownership', async () => {
  const created = await create(author, { status: 'published', authorId: outsider.id });
  expect(created.status).toBe(201);
  expect(created.body.data).toMatchObject({ status: 'pending', authorId: author.id });
  const id = created.body.data.id;
  expect((await request(app).get(`/api/calendar?${range}`)).body.data).toEqual([]);
  expect((await request(app).get(`/api/calendar/events/${id}`)).status).toBe(404);
  expect((await request(app).get(`/api/calendar/events/${id}`).set(headers(outsider))).status).toBe(404);
  expect((await request(app).get(`/api/calendar?${range}&view=mine`).set(headers(author))).body.data).toHaveLength(1);
  expect((await request(app).get(`/api/calendar?${range}&view=review&locationId=${town.id}`).set(headers(outsider))).status).toBe(403);
  expect((await request(app).get(`/api/calendar?${range}&view=review&locationId=${town.id}`).set(headers(moderator))).body.data).toHaveLength(1);
  expect((await update(id, outsider, { action: 'publish', revision: 0 })).status).toBe(403);
  expect((await update(id, author, { action: 'publish', revision: 0 })).status).toBe(403);
  expect((await update(id, moderator, { action: 'publish', revision: 0 })).status).toBe(200);
  expect((await update(id, moderator, { action: 'reject', revision: 0 })).status).toBe(409);
  const listed = await request(app).get(`/api/calendar?${range}`);
  expect(listed.body.data[0]).toMatchObject({ source: 'location-event', sourceId: id, href: `/events/${id}`, status: 'published' });
  expect(listed.body.data[0].authorId).toBeUndefined();
});
test('location descendants are opt-in; overlapping events are included', async () => {
  await create(moderator, { start: '2026-09-30T12:00:00Z', end: '2026-10-02T12:00:00Z' });
  await create(moderator, { start: '2026-09-30T12:00:00Z', end: '2026-10-01T00:00:00Z' });
  expect((await request(app).get(`/api/calendar?${range}&locationId=${parent.id}`)).body.data).toHaveLength(0);
  const list = await request(app).get(`/api/calendar?${range}&locationId=${parent.id}&descendants=true`);
  expect(list.body.data).toHaveLength(1);
  expect(list.body.data[0].locationId).toBe(town.id);
});
test('author edits return to approval; cancellation remains publicly visible', async () => {
  const { body } = await create();
  const id = body.data.id;
  await update(id, moderator, { action: 'publish', revision: 0 });
  const edited = await update(id, author, { ...payload, title: 'Updated meeting', revision: 1, status: 'published', locationId: parent.id });
  expect(edited.body.data).toMatchObject({ status: 'pending', locationId: town.id, revision: 2 });
  await update(id, moderator, { action: 'publish', revision: 2 });
  expect((await update(id, author, { action: 'cancel', revision: 3 })).body.data.status).toBe('cancelled');
  expect((await request(app).get(`/api/calendar?${range}`)).body.data[0].status).toBe('cancelled');
});
test('invalid dates, zones, links and excessive ranges fail validation', async () => {
  for (const values of [{ end: payload.start }, { start: '2026-10-20T18:00' }, { timezone: 'Nowhere/City' }, { sourceUrl: 'javascript:alert(1)' }, { allDay: true }, { title: ' ' }]) {
    expect((await create(author, values)).status).toBe(400);
  }
  expect((await create(author, { allDay: true, start: '2026-10-20T00:00:00Z', end: '2026-10-21T00:00:00Z' })).status).toBe(201);
  expect((await request(app).get('/api/calendar?start=2020-01-01T00:00:00Z&end=2026-01-01T00:00:00Z')).status).toBe(400);
});

test('complete month returns more than 100 events, without exposing pending entries', async () => {
  await LocationEvent.bulkCreate(Array.from({ length: 125 }, (_, i) => ({
    ...payload, locationId: town.id, authorId: author.id, title: `Event ${i}`, status: 'published',
  })));
  await create();
  const page = await request(app).get(`/api/calendar?${range}`);
  expect(page.body.data).toHaveLength(100);
  const month = await request(app).get(`/api/calendar?${range}&complete=true`);
  expect(month.status).toBe(200);
  expect(month.body.data).toHaveLength(125);
  expect(month.body.pagination).toEqual({ page: 1, totalPages: 1, total: 125 });
  expect((await request(app).get('/api/calendar?start=2026-01-01T00:00:00Z&end=2026-04-01T00:00:00Z&complete=true')).status).toBe(400);
});

test('upcoming includes ongoing events and respects the local end of all-day events', async () => {
  await create(moderator, { title: 'Ended', start: '2026-10-20T00:00:00Z', end: '2026-10-20T01:00:00Z' });
  await create(moderator, { title: 'Ongoing', start: '2026-10-20T00:00:00Z', end: '2026-10-21T04:00:00Z' });
  await create(moderator, { title: 'Still today in LA', allDay: true, timezone: 'America/Los_Angeles', start: '2026-10-20T00:00:00Z', end: '2026-10-21T00:00:00Z' });
  await create(moderator, { title: 'Ended in Athens', allDay: true, timezone: 'Europe/Athens', start: '2026-10-20T00:00:00Z', end: '2026-10-21T00:00:00Z' });
  const upcoming = await request(app).get('/api/calendar?start=2026-10-21T02:00:00Z&end=2026-11-01T00:00:00Z&period=upcoming');
  expect(upcoming.body.data.map(e => e.title).sort()).toEqual(['Ongoing', 'Still today in LA']);
  const past = await request(app).get('/api/calendar?start=2026-10-01T00:00:00Z&end=2026-10-21T02:00:00Z&period=past');
  expect(past.body.data.map(e => e.title).sort()).toEqual(['Ended', 'Ended in Athens']);
});

test('rejection requires private feedback and sends one author notification after successful review', async () => {
  const { body } = await create();
  const id = body.data.id;
  expect((await update(id, moderator, { action: 'reject', revision: 0 })).status).toBe(400);
  expect(await Notification.count()).toBe(0);
  const rejected = await update(id, moderator, { action: 'reject', revision: 0, reviewNote: 'Please confirm the venue.' });
  expect(rejected.body.data.reviewNote).toBe('Please confirm the venue.');
  const notice = await Notification.findOne();
  expect(notice.userId).toBe(author.id);
  expect(notice.actionUrl).toBe(`/events/${id}`);
  expect(notice.metadata).toMatchObject({ kind: 'calendar_review', status: 'rejected' });
  expect((await update(id, moderator, { action: 'reject', revision: 0, reviewNote: 'Duplicate' })).status).toBe(409);
  expect(await Notification.count()).toBe(1);
  expect((await request(app).get(`/api/calendar/events/${id}`).set(headers(author))).body.data.reviewNote).toBe('Please confirm the venue.');
  expect((await request(app).get(`/api/calendar/events/${id}`).set(headers(outsider))).status).toBe(404);
  const revised = await update(id, author, { ...payload, revision: 1 });
  expect(revised.body.data).toMatchObject({ status: 'pending', reviewNote: '' });
  await update(id, moderator, { action: 'publish', revision: 2 });
  expect((await request(app).get(`/api/calendar/events/${id}`)).body.data.reviewNote).toBeUndefined();
  expect(await Notification.count()).toBe(2);
  await update(id, author, { action: 'cancel', revision: 3 });
  expect(await Notification.count()).toBe(2);
});

test('public benefit category and source expose official dates without creating location events', async () => {
  const period = 'start=2026-11-01T00:00:00Z&end=2026-12-10T00:00:00Z';
  const category = await request(app).get(`/api/calendar?${period}&category=benefits`);
  expect(category.status).toBe(200);
  expect(category.body.data).toHaveLength(5);
  expect(category.body.data.every(entry => entry.source === 'benefit' && entry.href.startsWith('/citizen-help/benefits#'))).toBe(true);
  const source = await request(app).get(`/api/calendar?${period}&source=benefit`);
  expect(source.body.data).toEqual(category.body.data);
  expect(await LocationEvent.count()).toBe(0);
  const scoped = await request(app).get(`/api/calendar?${period}&locationId=${town.id}&category=benefits`);
  expect(scoped.body.data).toEqual([]);
  const mine = await request(app).get(`/api/calendar?${period}&view=mine`).set(headers(author));
  expect(mine.body.data).toEqual([]);
});

test('merged source pagination preserves official deadlines alongside community entries', async () => {
  await LocationEvent.bulkCreate(Array.from({ length: 102 }, (_, i) => ({
    ...payload, start: '2026-11-25T12:00:00Z', end: '2026-11-25T13:00:00Z',
    locationId: town.id, authorId: author.id, title: `November event ${i}`, status: 'published',
  })));
  const period = 'start=2026-11-01T00:00:00Z&end=2026-12-10T00:00:00Z';
  const first = await request(app).get(`/api/calendar?${period}`);
  const second = await request(app).get(`/api/calendar?${period}&page=2`);
  const entries = [...first.body.data, ...second.body.data];
  expect(first.body.pagination.total).toBe(107);
  expect(entries).toHaveLength(107);
  expect(new Set(entries.map(entry => entry.id)).size).toBe(107);
  expect(entries.filter(entry => entry.source === 'benefit')).toHaveLength(5);
  expect(entries.map(entry => entry.start)).toEqual(entries.map(entry => entry.start).sort());
});

test('poll deadlines follow the source poll and respect visibility and location filters', async () => {
  const poll = values => Poll.create({ creatorId: author.id, title: 'Town poll', deadline: '2090-10-10T12:30:00Z', ...values });
  const local = await poll({ locationId: town.id });
  const linked = await poll({ title: 'Linked poll' });
  await LocationLink.create({ location_id: town.id, entity_type: 'poll', entity_id: linked.id });
  const elsewhere = await poll({ title: 'Unscoped poll' });
  await poll({ visibility: 'private', locationId: town.id });
  await poll({ visibility: 'locals_only', locationId: town.id });
  await poll({ status: 'archived' });
  await poll({ status: 'closed' });
  await poll({ deadline: null });
  const historical = await poll({ deadline: '2024-10-06T15:00:00Z', status: 'closed' });
  const url = '/api/calendar?start=2090-10-01T00:00:00Z&end=2090-11-01T00:00:00Z&category=polls';
  const response = await request(app).get(url).set(headers(moderator));
  expect(response.status).toBe(200);
  expect(response.body.data.map(entry => entry.sourceId)).toEqual([local.id, linked.id, elsewhere.id]);
  expect(response.body.data[0]).toMatchObject({
    source: 'poll-deadline', category: 'polls', href: `/polls/${local.id}`, timezone: 'UTC',
    start: '2090-10-10T12:30:00.000Z', end: '2090-10-10T12:30:00.001Z',
  });
  const scoped = await request(app).get(`${url}&complete=true&locationId=${parent.id}&descendants=true`);
  expect(scoped.body.data.map(entry => entry.sourceId)).toEqual([local.id, linked.id]);
  expect((await request(app).get(`${url}&locationId=${parent.id}`)).body.data).toEqual([]);
  expect((await request(app).get(`${url}&view=mine`).set(headers(author))).body.data).toEqual([]);
  expect((await request(app).get('/api/calendar?start=2024-10-01T00:00:00Z&end=2024-11-01T00:00:00Z&period=past&source=poll-deadline')).body.data[0].sourceId).toBe(historical.id);
  await local.update({ deadline: '2090-10-12T18:00:00Z' });
  const updated = await request(app).get(`${url}&source=poll-deadline`);
  expect(updated.body.data.at(-1)).toMatchObject({ sourceId: local.id, start: '2090-10-12T18:00:00.000Z' });
});

test('confirmed election dates are all-day entries with official source links', async () => {
  const url = '/api/calendar?start=2024-06-01T00:00:00Z&end=2024-07-01T00:00:00Z&category=elections';
  const response = await request(app).get(url);
  expect(response.body.data).toEqual([expect.objectContaining({
    source: 'election', category: 'elections', allDay: true, timezone: 'Europe/Athens',
    start: '2024-06-09T00:00:00.000Z', end: '2024-06-10T00:00:00.000Z',
    href: 'https://results.elections.europa.eu/en/greece/',
  })]);
  expect((await request(app).get(`${url}&locationId=${town.id}`)).body.data).toEqual([]);
});

test('next event searches by displayed date across months, skipping cancellations', async () => {
  await LocationEvent.bulkCreate([
    { title: 'Cancelled meeting', status: 'cancelled', start: '2026-11-02T12:00:00Z', end: '2026-11-02T13:00:00Z' },
    { title: 'December in Athens', status: 'published', start: '2026-11-30T22:00:00Z', end: '2026-11-30T23:00:00Z' },
    { title: 'November in Los Angeles', status: 'published', timezone: 'America/Los_Angeles', start: '2026-12-01T00:30:00Z', end: '2026-12-01T01:00:00Z' },
  ].map(values => ({ ...payload, locationId: town.id, authorId: author.id, ...values })));
  const url = `/api/calendar/next?from=2026-11-01&category=meeting&locationId=${parent.id}`;
  expect((await request(app).get(`${url}&descendants=true`)).body).toEqual({ success: true, day: '2026-11-30' });
  expect((await request(app).get(url)).body).toEqual({ success: true, day: null });
  expect((await request(app).get('/api/calendar/next?from=2026-02-30')).status).toBe(400);
  expect((await request(app).get('/api/calendar/next?from=2026-11-01&view=mine')).status).toBe(401);
});
