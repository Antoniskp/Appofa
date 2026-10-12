const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { sequelize, User, Location, UserLocationRole, LocationImprovement } = require('../src/models');
const routes = require('../src/routes/locationRoutes');
const { storeCsrfToken } = require('../src/utils/csrf');

const app = express();
app.use(express.json());
app.use('/api/locations', routes);
let author, outsider, moderator, admin, parent, town, other;
const payload = { kind: 'addition', field: 'description', proposedValue: 'A town with a public library.', sourceUrl: 'https://example.org/library', note: 'Checked the official site.' };
const headers = user => {
  const csrf = `improvement-csrf-${user.id}`;
  storeCsrfToken(csrf, user.id);
  return { Authorization: `Bearer ${jwt.sign({ id: user.id, sessionVersion: user.sessionVersion }, process.env.JWT_SECRET)}`, Cookie: `csrf_token=${csrf}`, 'x-csrf-token': csrf };
};
const path = () => `/api/locations/${town.id}/improvements`;
const create = (data = payload) => request(app).post(path()).set(headers(author)).send(data);
const review = (id, data, actor = moderator) => request(app).patch(`${path()}/${id}/review`).set(headers(actor)).send(data);

beforeAll(async () => {
  await sequelize.sync({ force: true });
  parent = await Location.create({ name: 'Parent', slug: 'parent', type: 'country' });
  town = await Location.create({ name: 'Town', slug: 'town', type: 'municipality', parent_id: parent.id });
  other = await Location.create({ name: 'Other', slug: 'other', type: 'country' });
  for (const [name, role] of [['author', 'viewer'], ['outsider', 'moderator'], ['moderator', 'moderator'], ['admin', 'admin']]) {
    const user = await User.create({ username: name, email: `${name}@example.test`, password: 'Password123!', role, isVerified: true, homeLocationId: town.id });
    if (name === 'author') author = user;
    if (name === 'outsider') outsider = user;
    if (name === 'moderator') moderator = user;
    if (name === 'admin') admin = user;
  }
  await UserLocationRole.create({ userId: moderator.id, locationId: parent.id, roleKey: 'moderator' });
  await UserLocationRole.create({ userId: outsider.id, locationId: other.id, roleKey: 'moderator' });
});
beforeEach(async () => {
  await LocationImprovement.destroy({ where: {} });
  await town.update({ description: null, population_override: null, population: null, wikipedia_url: null, wikipedia_image_url: null, wikipedia_data_updated_at: null });
});
afterAll(() => sequelize.close());

test('guests cannot submit; authenticated mutations require CSRF', async () => {
  expect((await request(app).post(path()).send(payload)).status).toBe(401);
  const auth = headers(author);
  delete auth['x-csrf-token'];
  expect((await request(app).post(path()).set(auth).send(payload)).status).toBe(403);
  expect(await LocationImprovement.count()).toBe(0);
});

test('submission is pending, server-owned, and visible only to author and scoped reviewers', async () => {
  const result = await create({ ...payload, authorId: admin.id, status: 'accepted', originalValue: 'forged', revision: 99 });
  expect(result.status).toBe(201);
  expect(result.body.data).toMatchObject({ authorId: author.id, status: 'pending', originalValue: '', revision: 0 });
  expect((await town.reload()).description).toBeNull();
  expect((await request(app).get(path())).body.data).toEqual([]);
  expect((await request(app).get(`${path()}?view=mine`).set(headers(author))).body.data).toHaveLength(1);
  expect((await request(app).get(`${path()}?view=mine`).set(headers(outsider))).body.data).toHaveLength(0);
  expect((await request(app).get(`${path()}?view=review`).set(headers(moderator))).body.data).toHaveLength(1);
  expect((await request(app).get(`${path()}?view=review`).set(headers(outsider))).status).toBe(403);
  expect((await request(app).get(`${path()}?view=mine`)).status).toBe(401);
});

test('home location is not moderation authority, but assignment to an ancestor is', async () => {
  const { body } = await create();
  expect((await review(body.data.id, { status: 'accepted', revision: 0 }, outsider)).status).toBe(403);
  expect((await review(body.data.id, { status: 'accepted', revision: 0 }, author)).status).toBe(403);
  expect((await review(body.data.id, { status: 'accepted', revision: 0 })).status).toBe(200);
  expect((await town.reload()).description).toBe(payload.proposedValue);
  const history = await request(app).get(path());
  expect(history.headers['cache-control']).toBe('private, no-store');
  expect(history.body.data[0]).toMatchObject({ status: 'accepted', originalValue: '', proposedValue: payload.proposedValue, sourceUrl: payload.sourceUrl, author: { username: 'author' } });
  expect(history.body.data[0].note).toBeUndefined();
  expect(history.body.data[0].reviewNote).toBeUndefined();
  expect((await review(body.data.id, { status: 'accepted', revision: 0 })).status).toBe(409);
});

test('clarification requires feedback, permits only author revision, and can then publish', async () => {
  const { body } = await create();
  const id = body.data.id;
  expect((await review(id, { status: 'needs_clarification', revision: 0 })).status).toBe(400);
  expect((await review(id, { status: 'needs_clarification', revision: 0, reviewNote: 'Please verify the opening date.' })).status).toBe(200);
  const next = { ...payload, proposedValue: 'The library opened in 2020.', revision: 1 };
  expect((await request(app).patch(`${path()}/${id}`).set(headers(outsider)).send(next)).status).toBe(403);
  expect((await request(app).patch(`${path()}/${id}`).set(headers(author)).send({ ...next, revision: 0 })).status).toBe(409);
  expect((await request(app).patch(`${path()}/${id}`).set(headers(author)).send(next)).status).toBe(200);
  expect((await review(id, { status: 'accepted', revision: 2 }, admin)).status).toBe(200);
  expect((await town.reload()).description).toBe(next.proposedValue);
});

test('stale edits cannot overwrite published content or become accepted', async () => {
  const { body } = await create();
  await town.update({ description: 'Newer information.' });
  expect((await review(body.data.id, { status: 'accepted', revision: 0 })).status).toBe(409);
  expect((await town.reload()).description).toBe('Newer information.');
  expect((await LocationImprovement.findByPk(body.data.id)).status).toBe('pending');
});

test('decline requires a reason and does not publish', async () => {
  const { body } = await create();
  expect((await review(body.data.id, { status: 'declined', revision: 0, reviewNote: 'Source does not support the text.' })).status).toBe(200);
  expect((await town.reload()).description).toBeNull();
  expect((await request(app).get(path())).body.data).toEqual([]);
  expect((await request(app).get(`${path()}?view=mine`).set(headers(author))).body.data[0].reviewNote).toBeTruthy();
});

test.each([
  { field: 'role' }, { kind: 'invalid' }, { proposedValue: ' ' }, { sourceUrl: 'javascript:alert(1)' },
  { sourceUrl: 'https://user:secret@example.org' }, { kind: 'source', sourceUrl: '' },
  { field: 'wikipedia_url', proposedValue: 'https://wikipedia.org.evil.test/wiki/A' },
  { field: 'wikipedia_url', proposedValue: `https://en.wikipedia.org/wiki/${'x'.repeat(500)}` },
  { field: 'population_override', proposedValue: '-2' }, { field: 'population_override', proposedValue: '2147483648' },
  { field: 'name_local', proposedValue: 'x'.repeat(256) },
])('rejects invalid fields, values and unsafe source links: %j', async patch => {
  expect((await create({ ...payload, ...patch })).status).toBe(400);
});

test('accepts population and source-only changes and rejects cross-location review URLs', async () => {
  const { body } = await create({ ...payload, field: 'population_override', proposedValue: '00123' });
  expect((await request(app).patch(`/api/locations/${other.id}/improvements/${body.data.id}/review`).set(headers(admin)).send({ status: 'accepted', revision: 0 })).status).toBe(404);
  expect((await review(body.data.id, { status: 'accepted', revision: 0 })).status).toBe(200);
  expect((await town.reload()).population_override).toBe(123);
  const source = await create({ ...payload, kind: 'source', field: 'population_override', proposedValue: '123' });
  expect((await review(source.body.data.id, { status: 'accepted', revision: 0 })).status).toBe(200);
});

test('migration can create and remove the feature schema on SQLite', async () => {
  const { Sequelize } = require('sequelize');
  const db = new Sequelize('sqlite::memory:', { logging: false });
  const qi = db.getQueryInterface();
  const migration = require('../src/migrations/20261012000000-create-location-improvements');
  try {
    await qi.createTable('Locations', { id: { type: Sequelize.INTEGER, primaryKey: true } });
    await qi.createTable('Users', { id: { type: Sequelize.INTEGER, primaryKey: true } });
    await migration.up(qi, Sequelize);
    expect((await qi.describeTable('Locations')).description).toBeDefined();
    expect((await qi.describeTable('LocationImprovements')).revision).toBeDefined();
    await migration.down(qi, Sequelize);
    expect((await qi.describeTable('Locations')).description).toBeUndefined();
  } finally { await db.close(); }
});

test('population proposals snapshot the displayed Wikipedia fallback and detect changes', async () => {
  await town.update({ population: 100 });
  const { body } = await create({ ...payload, field: 'population_override', proposedValue: '123' });
  expect(body.data.originalValue).toBe('100');
  await town.update({ population: 110 });
  expect((await review(body.data.id, { status: 'accepted', revision: 0 })).status).toBe(409);
});

test('a changed Wikipedia link clears data cached from the old article', async () => {
  await town.update({ wikipedia_url: 'https://en.wikipedia.org/wiki/Old', wikipedia_image_url: 'https://example.org/old.jpg', population: 100, wikipedia_data_updated_at: new Date() });
  const { body } = await create({ ...payload, field: 'wikipedia_url', proposedValue: 'https://en.wikipedia.org/wiki/New' });
  expect((await review(body.data.id, { status: 'accepted', revision: 0 })).status).toBe(200);
  expect((await town.reload()).toJSON()).toMatchObject({ wikipedia_url: 'https://en.wikipedia.org/wiki/New', wikipedia_image_url: null, population: null, wikipedia_data_updated_at: null });
});
