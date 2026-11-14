const express = require('express');
const request = require('supertest');
const { sequelize, Suggestion, Location, User } = require('../src/models');
const app = express();
app.get('/map', require('../src/controllers/mapSuggestionController').list);
app.get('/address', require('../src/controllers/mapAddressController').search);
let town, child, other, author;
const report = overrides => ({ title: 'Broken street light', body: 'The light on Oak Street needs repair.', type: 'problem',
  authorId: author.id, locationId: town.id, mapLat: 37.98, mapLng: 23.72, mapIssueType: 'broken_lighting', ...overrides });

beforeAll(async () => {
  await sequelize.sync({ force: true });
  author = await User.create({ username: 'map-author', email: 'map@example.test', password: 'TestPassword123!' });
  town = await Location.create({ name: 'Athens', slug: 'map-athens', type: 'municipality' });
  child = await Location.create({ name: 'Neighbourhood', slug: 'map-child', type: 'municipality', parent_id: town.id });
  other = await Location.create({ name: 'Elsewhere', slug: 'map-other', type: 'municipality' });
});
beforeEach(async () => { await Suggestion.destroy({ where: {} }); });
afterAll(async () => { await sequelize.close(); });

test('includes descendants, excludes private and unpinned items, and does not disclose authors', async () => {
  await Suggestion.bulkCreate([report({}), report({ locationId: child.id }), report({ visibility: 'private' }),
    report({ visibility: 'locals_only' }), report({ locationId: other.id }), report({ mapLat: null, mapLng: null })]);
  const response = await request(app).get('/map').query({ locationId: town.id });
  expect(response.status).toBe(200);
  expect(response.body.pagination.total).toBe(2);
  expect(response.body.data.map(item => item.locationId).sort()).toEqual([town.id, child.id].sort());
  expect(response.body.data[0]).not.toHaveProperty('authorId');
  expect(response.body.data[0]).not.toHaveProperty('author');
});

test('applies category, status, date, street search and viewport together', async () => {
  await Suggestion.bulkCreate([report({}), report({ status: 'implemented' }), report({ mapIssueType: 'trash' }),
    report({ mapLat: 40 }), report({ createdAt: new Date('2020-01-01') })]);
  const response = await request(app).get('/map').query({ locationId: town.id, status: 'open', issueType: 'broken_lighting',
    search: 'Oak Street', days: 30, north: 38, south: 37, west: 23, east: 24 });
  expect(response.status).toBe(200);
  expect(response.body.data).toHaveLength(1);
});

test('paginates beyond the normal location feed without dropping or duplicating pins', async () => {
  await Suggestion.bulkCreate(Array.from({ length: 103 }, (_, index) => report({ title: `Street issue ${index}` })));
  const first = await request(app).get('/map').query({ locationId: town.id });
  const second = await request(app).get('/map').query({ locationId: town.id, page: 2 });
  expect(first.body.data).toHaveLength(100);
  expect(second.body.data).toHaveLength(3);
  expect(new Set([...first.body.data, ...second.body.data].map(item => item.id)).size).toBe(103);
});

test.each([{ locationId: 'bad' }, { status: 'bad' }, { north: '' }, { north: 40, south: 50, east: 20, west: 10 }])('rejects invalid map query %j', async query => {
  expect((await request(app).get('/map').query({ locationId: town.id, ...query })).status).toBe(400);
});

test('address search caches results, identifies the application and limits upstream traffic', async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [{ display_name: 'Oak Street, Athens', lat: '37.98', lon: '23.72' }] });
  try {
    const query = { q: 'Oak Street', locationId: town.id };
    const first = await request(app).get('/address').query(query);
    expect(first.body.data).toEqual([{ label: 'Oak Street, Athens', lat: 37.98, lng: 23.72 }]);
    expect((await request(app).get('/address').query(query)).status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][1].headers['User-Agent']).toContain('Appofasi');
    expect((await request(app).get('/address').query({ ...query, q: 'Different Street' })).status).toBe(429);
  } finally { global.fetch = originalFetch; }
});
