const express = require('express');
const request = require('supertest');
const { sequelize, User, Location, LocationSection, Suggestion, Poll } = require('../src/models');
const app = express();
app.get('/map', require('../src/controllers/homeMapController').list);
let country, region, town, author;
const bounds = { north: 38.1, south: 37.9, west: 23.6, east: 23.9 };
beforeAll(async () => {
  await sequelize.sync({ force: true });
  author = await User.create({ username: 'map-public', email: 'map-public@test.example', password: 'TestPassword123!' });
  country = await Location.create({ name: 'Greece', slug: 'greece', code: 'GR', type: 'country' });
  region = await Location.create({ name: 'Attica', slug: 'map-attica', type: 'prefecture', parent_id: country.id });
  town = await Location.create({ name: 'Athens', name_local: 'Αθήνα', slug: 'map-athens', type: 'municipality', parent_id: region.id, lat: 38, lng: 23.7, bounding_box: bounds });
  await Location.create({ name: 'Outside Greece', slug: 'outside', type: 'country' });
  await Suggestion.bulkCreate([
    { title: 'Public open issue', status: 'open' }, { title: 'Private issue', visibility: 'private' },
    { title: 'Locals issue', visibility: 'locals_only' }, { title: 'Resolved issue', status: 'implemented' },
  ].map(item => ({ body: 'A public map issue description.', type: 'problem', mapLat: 38, mapLng: 23.7,
    mapIssueType: 'trash', locationId: town.id, authorId: author.id, ...item })));
  await Poll.bulkCreate([
    { title: 'Active public vote' }, { title: 'Private public vote', visibility: 'private' },
    { title: 'Expired public vote', deadline: new Date('2020-01-01') }, { title: 'Closed public vote', status: 'closed' },
  ].map(item => ({ creatorId: author.id, locationId: town.id, ...item })));
  await LocationSection.bulkCreate([
    { isPublished: true, content: { webcams: [{ label: 'Exact camera', url: 'https://camera.example/live', lat: 38.01, lng: 23.71 },
      { label: 'Source camera', url: 'https://camera.example/source', isWorking: false },
      { label: 'Unsafe camera', url: 'javascript:alert(1)' }] } },
    { isPublished: false, content: { webcams: [{ label: 'Draft camera', url: 'https://camera.example/draft' }] } },
  ].map(item => ({ type: 'webcams', locationId: town.id, ...item })));
});
afterAll(async () => { await sequelize.close(); });

test('national summaries roll up descendants and exclude nonpublic and inactive content', async () => {
  const response = await request(app).get('/map');
  expect(response.status).toBe(200);
  expect(response.body.totals).toEqual({ issues: 1, polls: 1, cameras: 2 });
  expect(response.body.areas[0]).toMatchObject({ id: region.id, lat: 38, lng: 23.7, totals: response.body.totals });
  expect(response.body.items).toEqual([]);
});
test('detail feeds expose only public map fields and apply viewport bounds', async () => {
  const response = await request(app).get('/map').query({ locationId: region.id, detail: true, ...bounds });
  expect(response.body.items).toHaveLength(1);
  expect(response.body.items[0]).toMatchObject({ title: 'Public open issue', kind: 'issues', lat: 38, lng: 23.7 });
  expect(response.body.items[0]).not.toHaveProperty('authorId');
  expect(response.body.items[0]).not.toHaveProperty('body');
  const outside = await request(app).get('/map').query({ detail: true, ...bounds, south: 39, north: 40 });
  expect(outside.body.items).toEqual([]);
  const scoped = await request(app).get('/map').query({ locationId: town.id });
  expect(scoped.body.location.bounding_box).toEqual(bounds);
});
test('votes use approximate area pins and cameras retain exact/source pin accuracy', async () => {
  const votes = await request(app).get('/map').query({ layer: 'polls', detail: true, ...bounds });
  expect(votes.status).toBe(200);
  expect(votes.body.items).toEqual([expect.objectContaining({ title: 'Active public vote', approximate: true, href: expect.stringMatching(/^\/polls\//) })]);
  const cameras = await request(app).get('/map').query({ layer: 'cameras', detail: true, ...bounds });
  expect(cameras.body.items).toEqual([
    expect.objectContaining({ title: 'Exact camera', approximate: false, lat: 38.01, isWorking: true }),
    expect.objectContaining({ title: 'Source camera', approximate: true, isWorking: false }),
  ]);
});
test('search handles Greek accents and stays within Greece', async () => {
  const response = await request(app).get('/map').query({ search: 'αθηνα' });
  expect(response.body.locations.map(item => item.id)).toEqual([town.id]);
  expect((await request(app).get('/map').query({ search: 'Outside' })).body.locations).toEqual([]);
});
test('paginates visible issues with stable ordering', async () => {
  await Suggestion.bulkCreate(Array.from({ length: 101 }, (_, index) => ({ title: `Public issue ${index}`, body: 'A map issue description.',
    type: 'problem', visibility: 'public', status: 'open', mapLat: 38, mapLng: 23.7, locationId: town.id, authorId: author.id })));
  const first = await request(app).get('/map').query({ detail: true, ...bounds });
  const next = await request(app).get('/map').query({ detail: true, page: 2, ...bounds });
  expect(first.body.items).toHaveLength(100);
  expect(next.body.items).toHaveLength(2);
  expect(new Set([...first.body.items, ...next.body.items].map(item => item.id)).size).toBe(102);
});
test.each([{ locationId: 'bad' }, { layer: 'private' }, { detail: 'true' }, { page: '0' }, { north: 0 }, { ...bounds, south: 50 }])('rejects invalid map query %j', async query => {
  expect((await request(app).get('/map').query(query)).status).toBe(400);
});
