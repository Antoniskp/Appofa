const express = require('express');
const request = require('supertest');
const { sequelize, Location, TikTokCreator, User, VideoPin } = require('../src/models');
const { errorHandler } = require('../src/middleware/errorHandler');
const { storeCsrfToken } = require('../src/utils/csrf');
const authRoutes = require('../src/routes/authRoutes');
const creatorRoutes = require('../src/routes/tiktokCreatorRoutes');
const videoPinRoutes = require('../src/routes/videoPinRoutes');
const creatorMigration = require('../src/migrations/20261123000001-create-tiktok-creators');

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
    await creatorMigration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    region = await Location.create({ name: 'Attica', slug: 'attica', type: 'prefecture' });
    town = await Location.create({ name: 'Athens', slug: 'athens', type: 'municipality', parent_id: region.id });
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
    const pending = await request(app).get(directoryUrl).query({ status: 'pending' }).expect(200);
    expect(pending.body.data.creators).toEqual([]);

    const queue = await request(app).get(`${directoryUrl}/review`).set(staff).expect(200);
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
    const hidden = await request(app).get(directoryUrl).expect(200);
    expect(hidden.body.data.creators).toEqual([]);
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
