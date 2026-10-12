const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { sequelize, User, Location, UserLocationRole, LocationEvent } = require('../src/models');
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
beforeEach(() => LocationEvent.destroy({ where: {} }));
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
