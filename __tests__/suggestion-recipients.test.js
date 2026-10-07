const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { sequelize, User, Location, GovernmentPosition, Suggestion } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');
const routes = require('../src/routes/suggestionRoutes');
const app = express();
app.use(express.json());
app.use('/api/suggestions', routes);

describe('Suggestions addressed to public offices', () => {
  let country, region, town, otherTown, otherCountry, minister, inactive, foreignMinister, user, outsider;
  const body = { title: 'Safer streets for everyone', body: 'Please improve the lighting around the school.' };
  const headers = user => {
    const token = `recipient-csrf-${user.id}`;
    storeCsrfToken(token, user.id);
    return { Authorization: `Bearer ${jwt.sign({ id: user.id, sessionVersion: user.sessionVersion }, process.env.JWT_SECRET)}`,
      Cookie: `csrf_token=${token}`, 'x-csrf-token': token };
  };
  const create = (data = {}) => request(app).post('/api/suggestions').set(headers(user)).send({ ...body, locationId: town.id, ...data });

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    country = await Location.create({ name: 'Greece', slug: 'greece', type: 'country', code: 'GR' });
    otherCountry = await Location.create({ name: 'Romania', slug: 'romania', type: 'country', code: 'RO' });
    region = await Location.create({ name: 'Region', slug: 'region', type: 'prefecture', parent_id: country.id });
    town = await Location.create({ name: 'Town', slug: 'town', type: 'municipality', parent_id: region.id });
    otherTown = await Location.create({ name: 'Other town', slug: 'other-town', type: 'municipality', parent_id: region.id });
    minister = await GovernmentPosition.create({ slug: 'minister', title: 'Υπουργός', titleEn: 'Minister', positionTypeKey: 'minister', countryCode: 'GR' });
    inactive = await GovernmentPosition.create({ slug: 'inactive', title: 'Inactive office', positionTypeKey: 'minister', countryCode: 'GR', isActive: false });
    foreignMinister = await GovernmentPosition.create({ slug: 'foreign', title: 'Foreign minister', positionTypeKey: 'minister', countryCode: 'RO' });
    user = await User.create({ username: 'proposer', email: 'proposer@test.com', password: 'Test1234!', homeLocationId: town.id });
    outsider = await User.create({ username: 'other', email: 'other@test.com', password: 'Test1234!', homeLocationId: otherTown.id });
  });
  afterAll(async () => sequelize.close());

  test('lists local and national offices, excluding unrelated or inactive offices', async () => {
    const result = await request(app).get(`/api/suggestions/recipients?locationId=${town.id}`);
    expect(result.status).toBe(200);
    expect(result.body.data.map(item => item.key)).toEqual([`mayor:${town.id}`, `regional:${region.id}`, `position:${minister.id}`]);
    const national = await request(app).get(`/api/suggestions/recipients?locationId=${country.id}`);
    expect(national.body.data.map(item => item.key)).toEqual([`position:${minister.id}`]);
  });
  test.each(['', 'abc', '-1', '1abc', '9999999'])('rejects invalid or missing location %s', async id => {
    expect((await request(app).get(`/api/suggestions/recipients?locationId=${id}`)).status).toBe(400);
  });
  test('creates a canonical recipient, ignores forged labels and supports detail and office feeds', async () => {
    const key = `mayor:${town.id}`;
    const result = await create({ recipientKey: key, recipient: { title: 'Forged title', key: 'position:999' } });
    expect(result.status).toBe(201);
    expect(result.body.data.recipient).toEqual({ key, kind: 'mayor', locationId: town.id, locationName: 'Town' });
    const detail = await request(app).get(`/api/suggestions/${result.body.data.id}`);
    expect(detail.body.data.recipientKey).toBe(key);
    const list = await request(app).get('/api/suggestions').query({ recipientKey: key });
    expect(list.body.data.map(item => item.id)).toContain(result.body.data.id);
    expect(list.body.data.every(item => item.recipientKey === key)).toBe(true);
  });
  test('legacy community proposals remain supported', async () => {
    const result = await create();
    expect(result.status).toBe(201);
    expect(result.body.data.recipientKey).toBeNull();
    const addressed = await request(app).get('/api/suggestions?addressed=true');
    expect(addressed.body.data.every(item => item.recipientKey)).toBe(true);
    expect(addressed.body.data.map(item => item.id)).not.toContain(result.body.data.id);
  });
  test('rejects unknown, inactive, foreign and mismatched local offices without saving', async () => {
    const count = await Suggestion.count();
    for (const recipientKey of ['invalid', `mayor:${otherTown.id}`, `position:${inactive.id}`, `position:${foreignMinister.id}`, 'position:999999']) {
      expect((await create({ recipientKey })).status).toBe(400);
    }
    expect((await create({ recipientKey: `mayor:${town.id}`, locationId: null })).status).toBe(400);
    expect(await Suggestion.count()).toBe(count);
  });
  test('validates location changes and allows explicit removal of the recipient', async () => {
    const created = await create({ recipientKey: `mayor:${town.id}` });
    const url = `/api/suggestions/${created.body.data.id}`;
    expect((await request(app).patch(url).set(headers(user)).send({ locationId: otherTown.id })).status).toBe(400);
    const changed = await request(app).patch(url).set(headers(user)).send({ locationId: otherTown.id, recipientKey: `mayor:${otherTown.id}` });
    expect(changed.status).toBe(200);
    expect(changed.body.data.recipient.locationId).toBe(otherTown.id);
    const cleared = await request(app).patch(url).set(headers(user)).send({ locationId: null, recipientKey: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.data.recipient).toBeNull();
  });
  test('preserves historical addresses on ordinary edits even when an office is inactive', async () => {
    const created = await create({ recipientKey: `position:${minister.id}` });
    await minister.update({ isActive: false });
    const updated = await request(app).patch(`/api/suggestions/${created.body.data.id}`).set(headers(user)).send({ title: 'Updated proposal title', recipientKey: `position:${minister.id}`, locationId: town.id });
    expect(updated.status).toBe(200);
    expect(updated.body.data.recipient.title).toBe('Υπουργός');
    await minister.update({ isActive: true });
  });
  test('recipient addressing does not grant edit or restricted read permissions', async () => {
    const created = await create({ recipientKey: `mayor:${town.id}`, visibility: 'locals_only' });
    const url = `/api/suggestions/${created.body.data.id}`;
    expect((await request(app).post('/api/suggestions').send(body)).status).toBe(401);
    expect((await request(app).patch(url).set(headers(outsider)).send({ recipientKey: null })).status).toBe(403);
    expect((await request(app).get(url)).status).toBe(403);
    const list = await request(app).get('/api/suggestions').query({ recipientKey: `mayor:${town.id}` });
    expect(list.body.data.map(item => item.id)).not.toContain(created.body.data.id);
    const otherList = await request(app).get('/api/suggestions').set(headers(outsider)).query({ recipientKey: `mayor:${town.id}` });
    expect(otherList.body.data.map(item => item.id)).not.toContain(created.body.data.id);
  });
});
