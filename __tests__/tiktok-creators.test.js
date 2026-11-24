const express = require('express');
const request = require('supertest');
const { sequelize, Location, TikTokCreator, User, VideoPin } = require('../src/models');
const { errorHandler } = require('../src/middleware/errorHandler');
const { storeCsrfToken } = require('../src/utils/csrf');
const authRoutes = require('../src/routes/authRoutes');
const creatorRoutes = require('../src/routes/tiktokCreatorRoutes');
const videoPinRoutes = require('../src/routes/videoPinRoutes');
const creatorMigration = require('../src/migrations/20261123000001-create-tiktok-creators');
const optionalMetadataMigration = require('../src/migrations/20261123000002-make-tiktok-creator-metadata-optional');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tiktok-creators', creatorRoutes);
app.use('/api/video-pins', videoPinRoutes);
app.use(errorHandler);

const directoryUrl = '/api/tiktok-creators';

async function staffHeaders() {
  const staff = await User.create({
    username: 'creator-moderator', email: 'creator-moderator@example.test', password: 'Test1234!', role: 'moderator',
  });
  const login = await request(app).post('/api/auth/login').send({ email: staff.email, password: 'Test1234!' }).expect(200);
  const session = login.headers['set-cookie'].find((cookie) => cookie.startsWith('auth_token=')).split(';')[0];
  const csrf = 'csrf-tiktok-directory-staff';
  storeCsrfToken(csrf, staff.id);
  return { Cookie: [session, `csrf_token=${csrf}`], 'x-csrf-token': csrf };
}

describe('TikTok directory and creator stream pins', () => {
  let region, town, staff;

  beforeAll(async () => {
    await sequelize.sync();
    // Exercise the deployed migration schema alongside the other synced models.
    await TikTokCreator.drop();
    const queryInterface = sequelize.getQueryInterface();
    await creatorMigration.up(queryInterface, sequelize.Sequelize);
    region = await Location.create({ name: 'Attica', slug: 'attica', type: 'prefecture' });
    town = await Location.create({ name: 'Athens', slug: 'athens', type: 'municipality', parent_id: region.id });
    const existing = await TikTokCreator.create({ handle: 'existing_creator', category: 'gaming', locationId: town.id, status: 'rejected' });
    await optionalMetadataMigration.up(queryInterface, sequelize.Sequelize);
    expect(await TikTokCreator.findByPk(existing.id)).toMatchObject({ handle: 'existing_creator', category: 'gaming', locationId: town.id });
    staff = await staffHeaders();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('keeps guest suggestions private until staff approval and filters descendants by category and handle', async () => {
    const profile = { profile: 'https://www.tiktok.com/@Civic_Voice?lang=en', locationId: town.id, category: 'politics', displayName: 'Civic Voice' };
    await request(app).post(directoryUrl).send({ ...profile, status: 'approved' }).expect(201);
    await request(app).post(directoryUrl).send({ ...profile, profile: '@civic_voice' }).expect(409);
    await request(app).post(directoryUrl).send({ ...profile, profile: 'https://www.tiktok.com.example/@other' }).expect(400);
    await request(app).get(`${directoryUrl}/review`).expect(401);
    const pending = await request(app).get(directoryUrl).query({ status: 'pending', q: profile.displayName }).expect(200);
    expect(pending.body.data.creators).toEqual([]);

    const queue = await request(app).get(`${directoryUrl}/review`).set(staff).query({ q: profile.displayName }).expect(200);
    const [suggestion] = queue.body.data.creators;
    expect(suggestion).toMatchObject({ handle: 'civic_voice', status: 'pending' });
    await request(app).put(`${directoryUrl}/review/${suggestion.id}`).set(staff)
      .send({ status: 'approved', expectedStatus: 'pending' }).expect(200);

    const filtered = await request(app).get(directoryUrl)
      .query({ locationId: region.id, category: 'politics', q: '@CIVIC_' }).expect(200);
    expect(filtered.body.data.creators).toEqual([{
      id: suggestion.id, handle: 'civic_voice', category: 'politics', locationId: town.id, displayName: 'Civic Voice',
      location: { id: town.id, name: 'Athens', name_local: null, slug: 'athens' },
    }]);
    const differentCategory = await request(app).get(directoryUrl).query({ category: 'gaming' }).expect(200);
    expect(differentCategory.body.data.creators).toEqual([]);

    await request(app).put(`${directoryUrl}/review/${suggestion.id}`).set(staff)
      .send({ status: 'rejected', expectedStatus: 'pending' }).expect(409);
    await request(app).put(`${directoryUrl}/review/${suggestion.id}`).set(staff)
      .send({ status: 'rejected', expectedStatus: 'approved' }).expect(200);
    const hidden = await request(app).get(directoryUrl).query({ q: profile.displayName }).expect(200);
    expect(hidden.body.data.creators).toEqual([]);
  });

  test.each([
    { handle: 'profile_only', input: {}, category: null, hasArea: false },
    { handle: 'profile_with_area', input: { category: '' }, category: null, hasArea: true },
    { handle: 'profile_with_category', input: { category: 'sports', locationId: null }, category: 'sports', hasArea: false },
  ])('lets guests suggest $handle and keeps it searchable after approval', async ({ handle, input, category, hasArea }) => {
    const locationId = hasArea ? town.id : null;
    await request(app).post(directoryUrl).send({ profile: `@${handle}`, ...input, ...(hasArea && { locationId }) }).expect(201);
    const queue = await request(app).get(`${directoryUrl}/review`).set(staff).query({ q: handle }).expect(200);
    const [suggestion] = queue.body.data.creators;
    expect(suggestion).toMatchObject({ handle, category, locationId, status: 'pending' });
    await request(app).put(`${directoryUrl}/review/${suggestion.id}`).set(staff)
      .send({ status: 'approved', expectedStatus: 'pending' }).expect(200);

    const byHandle = await request(app).get(directoryUrl).query({ q: handle }).expect(200);
    expect(byHandle.body.data.creators).toHaveLength(1);
    expect(byHandle.body.data.creators[0]).toMatchObject({ handle, category, locationId });
    const byCategory = await request(app).get(directoryUrl).query({ q: handle, category: 'sports' }).expect(200);
    expect(byCategory.body.data.creators).toHaveLength(category ? 1 : 0);
    const byRegion = await request(app).get(directoryUrl).query({ q: handle, locationId: region.id }).expect(200);
    expect(byRegion.body.data.creators).toHaveLength(hasArea ? 1 : 0);
  });

  test('rejects invalid optional metadata when it is supplied', async () => {
    await request(app).post(directoryUrl).send({ profile: '@invalid_creator', category: 'unknown' }).expect(400);
    await request(app).post(directoryUrl).send({ profile: '@invalid_creator', locationId: 'unknown' }).expect(400);
  });

  test('discovers saved member TikTok links according to profile visibility', async () => {
    const member = await User.create({
      username: 'member-creator', email: 'member-creator@example.test', password: 'Test1234!',
      firstNameNative: 'Marina', lastNameNative: 'Local', homeLocationId: town.id, profileVisibility: 'registered',
      socialLinks: { tiktok: 'https://www.tiktok.com/@Member_Creates?lang=en' },
    });
    const guestSearch = () => request(app).get(directoryUrl).query({ q: 'member_creates' }).expect(200);
    expect((await guestSearch()).body.data.creators).toEqual([]);
    const signedIn = await request(app).get(directoryUrl).set(staff).query({ q: 'Marina', locationId: region.id }).expect(200);
    expect(signedIn.headers['cache-control']).toBe('private, no-store');
    expect(signedIn.body.data.creators).toEqual([{
      id: `member-${member.id}`, handle: 'member_creates', username: 'member-creator', displayName: 'Marina Local',
      category: null, locationId: town.id, location: { id: town.id, name: 'Athens', name_local: null, slug: 'athens' },
    }]);

    await member.update({ profileVisibility: 'public' });
    expect((await guestSearch()).body.data.creators).toHaveLength(1);
    await TikTokCreator.create({ handle: 'member_creates', displayName: 'Pending name' });
    expect((await guestSearch()).body.data.creators).toMatchObject([{ displayName: 'Marina Local' }]);
    const listing = await TikTokCreator.findOne({ where: { handle: 'member_creates' } });
    await listing.update({ status: 'approved', category: 'sports', displayName: 'Public creator' });
    const combined = await request(app).get(directoryUrl).query({ q: 'Marina', category: 'sports', locationId: region.id }).expect(200);
    expect(combined.body.data.creators).toHaveLength(1);
    expect(combined.body.data.creators[0]).toMatchObject({ id: listing.id, category: 'sports', username: 'member-creator', locationId: town.id });

    await member.update({ profileVisibility: 'hidden' });
    expect((await guestSearch()).body.data.creators[0]).not.toHaveProperty('username');
    const hiddenSearch = await request(app).get(directoryUrl).set(staff).query({ q: 'Marina' }).expect(200);
    expect(hiddenSearch.body.data.creators).toEqual([]);
    await listing.update({ status: 'rejected' });
    await member.update({ profileVisibility: 'public' });
    expect((await guestSearch()).body.data.creators).toEqual([]);
  });

  test('paginates member profiles and reviewed listings together', async () => {
    await User.bulkCreate(Array.from({ length: 24 }, (_, index) => ({
      username: `pagination-${index}`,
      email: `pagination-${index}@example.test`,
      profileVisibility: 'public',
      socialLinks: { tiktok: `https://www.tiktok.com/@pagination_${index}` },
    })));
    await TikTokCreator.create({ handle: 'pagination_approved', status: 'approved' });

    const first = await request(app).get(directoryUrl).query({ q: 'pagination', page: 1 }).expect(200);
    expect(first.body.data).toMatchObject({ totalPages: 2 });
    expect(first.body.data.creators).toHaveLength(24);
    expect(first.body.data.creators.every(creator => creator.username)).toBe(true);
    const second = await request(app).get(directoryUrl).query({ q: 'pagination', page: 2 }).expect(200);
    expect(second.body.data.creators).toMatchObject([{ handle: 'pagination_approved' }]);
  });

  test('matches direct TikTok LIVE links by handle without leaking pending or expired streams', async () => {
    const pin = await request(app).post('/api/video-pins').set(staff)
      .send({ sourceUrl: 'https://www.tiktok.com/@Civic_Voice/live?lang=en', contentType: 'live', lat: 38, lng: 24 }).expect(201);
    const livePin = pin.body.data.videoPin;
    expect(livePin).toMatchObject({ creatorHandle: '@civic_voice', sourceUrl: 'https://www.tiktok.com/@civic_voice/live', status: 'approved' });
    await VideoPin.bulkCreate([
      { status: 'pending' },
      { expiresAt: new Date(Date.now() - 60_000) },
      { creatorHandle: '@another_creator' },
    ].map((overrides) => ({ ...livePin, id: undefined, ...overrides })));
    const streams = await request(app).get('/api/video-pins').query({ contentType: 'live', creator: 'CIVIC_VOICE' }).expect(200);
    expect(streams.body.data.videoPins.map((stream) => stream.id)).toEqual([livePin.id]);
  });
});
