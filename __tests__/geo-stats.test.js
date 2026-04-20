const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');
const { storeCsrfToken } = require('../src/utils/csrf');
const {
  sequelize,
  User,
  Location,
  LocationLink,
  Suggestion,
  GeoVisit,
  CountryFunding,
} = require('../src/models');

const authRoutes = require('../src/routes/authRoutes');
const geoStatsRoutes = require('../src/routes/geoStatsRoutes');

process.env.JWT_SECRET = 'geo-stats-test-secret';
process.env.NODE_ENV = 'test';

const app = express();
app.set('trust proxy', true);
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin/geo-stats', geoStatsRoutes);

function csrfHeadersFor(token, userId) {
  storeCsrfToken(token, userId);
  return {
    Cookie: [`csrf_token=${token}`],
    'x-csrf-token': token,
  };
}

async function registerAndLogin(username, role = 'viewer') {
  await User.create({
    username,
    email: `${username}@test.com`,
    password: 'Test1234!',
    role,
    firstNameNative: username,
    lastNameNative: 'User',
  });
  const user = await User.findOne({ where: { username } });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: `${username}@test.com`, password: 'Test1234!' });
  const authCookie = loginRes.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
  const token = authCookie?.split(';')[0].replace('auth_token=', '');
  return { token, id: user.id };
}

describe('Geo Stats Admin API', () => {
  let adminToken;
  let adminId;
  let viewerToken;
  let grLocation;
  let frLocation;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    ({ token: adminToken, id: adminId } = await registerAndLogin('geo_admin', 'admin'));
    ({ token: viewerToken } = await registerAndLogin('geo_viewer', 'viewer'));

    [grLocation, frLocation] = await Promise.all([
      Location.create({ name: 'Greece', type: 'country', slug: 'greece', code: 'GR' }),
      Location.create({ name: 'France', type: 'country', slug: 'france', code: 'FR' }),
    ]);

    await LocationLink.create({
      location_id: grLocation.id,
      entity_type: 'article',
      entity_id: 999,
    });

    const adminUser = await User.findByPk(adminId);
    await Suggestion.create({
      title: 'Greek suggestion',
      body: 'A sufficiently long body for suggestion coverage.',
      authorId: adminUser.id,
      locationId: grLocation.id,
    });

    const now = new Date();
    const tenDaysAgo = new Date(now);
    tenDaysAgo.setDate(now.getDate() - 10);

    await GeoVisit.bulkCreate([
      {
        countryCode: 'GR',
        countryName: 'Greece',
        isAuthenticated: true,
        isDiaspora: true,
        sessionHash: 'a'.repeat(64),
        path: '/',
      },
      {
        countryCode: 'GR',
        countryName: 'Greece',
        isAuthenticated: false,
        isDiaspora: false,
        sessionHash: 'b'.repeat(64),
        path: '/articles',
      },
      {
        countryCode: 'FR',
        countryName: 'France',
        isAuthenticated: false,
        isDiaspora: false,
        sessionHash: 'c'.repeat(64),
        path: '/',
      },
      {
        countryCode: 'FR',
        countryName: 'France',
        isAuthenticated: true,
        isDiaspora: false,
        sessionHash: 'd'.repeat(64),
        path: '/old',
        createdAt: tenDaysAgo,
        updatedAt: tenDaysAgo,
      },
    ]);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('GET /visits rejects non-admin users', async () => {
    const res = await request(app)
      .get('/api/admin/geo-stats/visits')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /visits returns aggregated data for period filters', async () => {
    const res = await request(app)
      .get('/api/admin/geo-stats/visits')
      .query({ period: '7d' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.period).toBe('7d');
    expect(res.body.data.totalVisits).toBe(3);
    const gr = res.body.data.byCountry.find((row) => row.countryCode === 'GR');
    expect(gr).toMatchObject({
      countryName: 'Greece',
      visits: 2,
      authenticated: 1,
      diaspora: 1,
    });
    expect(res.body.data.topPaths.length).toBeGreaterThan(0);
  });

  it('GET /countries includes funding and hasContent fields', async () => {
    await CountryFunding.create({
      locationId: grLocation.id,
      goalAmount: 500.00,
      currentAmount: 250.00,
      status: 'funding',
    });

    const res = await request(app)
      .get('/api/admin/geo-stats/countries')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const gr = res.body.data.find((row) => row.countryCode === 'GR');
    expect(gr.locationId).toBe(grLocation.id);
    expect(gr.hasContent).toBe(true);
    expect(gr.funding).toMatchObject({
      status: 'funding',
      goalAmount: 500,
      currentAmount: 250,
    });
  });

  it('POST/PUT/DELETE country-funding works for admin with CSRF', async () => {
    const createRes = await request(app)
      .post('/api/admin/geo-stats/country-funding')
      .set('Authorization', `Bearer ${adminToken}`)
      .set(csrfHeadersFor('csrf-geo-create', adminId))
      .send({
        locationId: frLocation.id,
        goalAmount: 700,
        donationUrl: 'https://example.com/donate-fr',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const createdId = createRes.body.data.id;

    const updateRes = await request(app)
      .put(`/api/admin/geo-stats/country-funding/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set(csrfHeadersFor('csrf-geo-update', adminId))
      .send({
        currentAmount: 700,
        donorCount: 5,
        status: 'unlocked',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.status).toBe('unlocked');
    expect(updateRes.body.data.unlockedByUserId).toBe(adminId);
    expect(updateRes.body.data.unlockedAt).toBeTruthy();

    const deleteRes = await request(app)
      .delete(`/api/admin/geo-stats/country-funding/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set(csrfHeadersFor('csrf-geo-delete', adminId));

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });

  it('GET /country-funding/:locationId/public returns funding without auth', async () => {
    const res = await request(app)
      .get(`/api/admin/geo-stats/country-funding/${grLocation.id}/public`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeTruthy();
    expect(res.body.data.locationId).toBe(grLocation.id);
    expect(res.body.data.location).toBeTruthy();
    expect(res.body.data.location.id).toBe(grLocation.id);
  });

  it('GET /country-funding/:locationId/public validates locationId', async () => {
    const res = await request(app)
      .get('/api/admin/geo-stats/country-funding/not-a-number/public');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
