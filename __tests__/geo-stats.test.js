const request = require('supertest');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
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
  let visitorUser;
  let grLocation;
  let frLocation;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    ({ token: adminToken, id: adminId } = await registerAndLogin('geo_admin', 'admin'));
    ({ token: viewerToken } = await registerAndLogin('geo_viewer', 'viewer'));
    visitorUser = await User.create({
      username: 'geo_visitor',
      email: 'geo_visitor@test.com',
      password: 'Test1234!',
      role: 'viewer',
      firstNameNative: 'Visitor',
      lastNameNative: 'User',
    });

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
        userId: visitorUser.id,
        isDiaspora: true,
        sessionHash: 'a'.repeat(64),
        ipAddress: '1.1.1.1',
        path: '/',
      },
      {
        countryCode: 'GR',
        countryName: 'Greece',
        isAuthenticated: false,
        isDiaspora: false,
        sessionHash: 'b'.repeat(64),
        ipAddress: '2.2.2.2',
        path: '/articles',
      },
      {
        countryCode: 'FR',
        countryName: 'France',
        isAuthenticated: false,
        isDiaspora: false,
        sessionHash: 'c'.repeat(64),
        ipAddress: '3.3.3.3',
        path: '/',
      },
      {
        countryCode: 'FR',
        countryName: 'France',
        isAuthenticated: true,
        isDiaspora: false,
        sessionHash: 'd'.repeat(64),
        ipAddress: '4.4.4.4',
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
    expect(res.body.data.recentVisits.length).toBeGreaterThan(0);
    expect(res.body.data.recentVisits[0]).toEqual(expect.objectContaining({
      ipAddress: expect.any(String),
      path: expect.any(String),
      countryCode: expect.any(String),
      createdAt: expect.any(String),
    }));
    const visitWithUser = res.body.data.recentVisits.find((row) => row.userId === visitorUser.id);
    expect(visitWithUser).toBeTruthy();
    expect(visitWithUser.username).toBe('geo_visitor');
  });

  it('DELETE /visits validates olderThanDays query', async () => {
    const invalidRes = await request(app)
      .delete('/api/admin/geo-stats/visits')
      .query({ olderThanDays: 0 })
      .set('Authorization', `Bearer ${adminToken}`)
      .set(csrfHeadersFor('csrf-geo-visits-invalid', adminId));

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.success).toBe(false);
  });

  it('DELETE /visits deletes old visit logs for admin', async () => {
    const beforeCount = await GeoVisit.count();
    expect(beforeCount).toBeGreaterThan(0);

    const res = await request(app)
      .delete('/api/admin/geo-stats/visits')
      .query({ olderThanDays: 7 })
      .set('Authorization', `Bearer ${adminToken}`)
      .set(csrfHeadersFor('csrf-geo-visits-delete', adminId));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('older than 7 days');

    const oldVisit = await GeoVisit.findOne({ where: { path: '/old' } });
    expect(oldVisit).toBeNull();
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

  it('POST /track stores sanitized visit payload', async () => {
    const res = await request(app)
      .post('/api/admin/geo-stats/track')
      .send({
        path: '/locations/gr',
        countryCode: 'gr-1',
        ipAddress: '::ffff:185.230.31.201',
        locale: 'el-GR',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const saved = await GeoVisit.findOne({ where: { path: '/locations/gr' } });
    expect(saved).toBeTruthy();
    expect(saved.countryCode).toBe('GR');
    expect(saved.countryName).toBe('Greece');
    expect(saved.ipAddress).toBe('::ffff:185.230.31.201');
    expect(saved.locale).toBe('el-GR');
    expect(saved.isAuthenticated).toBe(false);
    expect(saved.userId).toBeNull();
    expect(saved.sessionHash).toBe(
      crypto.createHash('sha256').update('::ffff:185.230.31.201').digest('hex')
    );
  });

  it('POST /track uses request IP when ipAddress is omitted from payload', async () => {
    const path = '/locations/request-ip';
    const res = await request(app)
      .post('/api/admin/geo-stats/track')
      .set('x-forwarded-for', '9.9.9.9, 10.0.0.1')
      .send({
        path,
        countryCode: 'GR',
        locale: 'en',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const saved = await GeoVisit.findOne({ where: { path } });
    expect(saved).toBeTruthy();
    expect(saved.ipAddress).toBe('9.9.9.9');
    expect(saved.sessionHash).toBe(
      crypto.createHash('sha256').update('9.9.9.9').digest('hex')
    );
  });

  it('POST /track decodes token for analytics authentication hints', async () => {
    const token = jwt.sign({ id: adminId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const path = '/locations/with-token';

    const res = await request(app)
      .post('/api/admin/geo-stats/track')
      .send({
        path,
        countryCode: 'GR',
        ipAddress: '5.5.5.5',
        locale: 'el',
        token,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const saved = await GeoVisit.findOne({ where: { path } });
    expect(saved).toBeTruthy();
    expect(saved.isAuthenticated).toBe(true);
    expect(saved.userId).toBe(adminId);
  });

  it('POST /track normalizes invalid and pseudo country codes to null', async () => {
    const testCases = [
      { path: '/norm-xx', code: 'XX' },
      { path: '/norm-empty', code: '' },
    ];

    for (const { path, code } of testCases) {
      const res = await request(app)
        .post('/api/admin/geo-stats/track')
        .send({ path, countryCode: code });

      expect(res.status).toBe(200);
      const saved = await GeoVisit.findOne({ where: { path } });
      expect(saved).toBeTruthy();
      expect(saved.countryCode).toBeNull();
      expect(saved.countryName).toBeNull();
    }
  });

  it('POST /track validates required path field', async () => {
    const res = await request(app)
      .post('/api/admin/geo-stats/track')
      .send({ countryCode: 'GR' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('path is required.');
  });
});
