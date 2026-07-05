const request = require('supertest');
const { sequelize, User } = require('../src/models');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');

const authRoutes = require('../src/routes/authRoutes');
const homepageSettingsRoutes = require('../src/routes/homepageSettingsRoutes');
const { storeCsrfToken } = require('../src/utils/csrf');

process.env.JWT_SECRET = 'test-jwt-secret-homepage-settings';
process.env.NODE_ENV = 'test';

const app = express();
app.set('trust proxy', true);
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/homepage-settings', homepageSettingsRoutes);

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
    lastNameNative: 'Test',
  });
  const user = await User.findOne({ where: { username } });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: `${username}@test.com`, password: 'Test1234!' });
  const authCookie = loginRes.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
  const token = authCookie?.split(';')[0].replace('auth_token=', '');
  return { token, id: user.id };
}

describe('Homepage Settings API', () => {
  let adminToken, adminId;
  let viewerToken, viewerId;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    ({ token: adminToken, id: adminId } = await registerAndLogin('homepage_admin', 'admin'));
    ({ token: viewerToken, id: viewerId } = await registerAndLogin('homepage_viewer', 'viewer'));
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('GET should return default settings for public', async () => {
    const res = await request(app).get('/api/homepage-settings');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.manifestSection).toEqual({ enabled: true, audience: 'all' });
    expect(res.body.data.infoSection).toBeUndefined();
  });

  it('PUT should reject unauthenticated requests', async () => {
    const res = await request(app)
      .put('/api/homepage-settings')
      .send({ manifestSection: { enabled: false, audience: 'registered' } });
    expect(res.status).toBe(401);
  });

  it('PUT should reject non-admin requests', async () => {
    const res = await request(app)
      .put('/api/homepage-settings')
      .set('Authorization', `Bearer ${viewerToken}`)
      .set(csrfHeadersFor('csrf-homepage-viewer', viewerId))
      .send({ manifestSection: { enabled: false, audience: 'registered' } });
    expect(res.status).toBe(403);
  });

  it('PUT should update manifest section for admin', async () => {
    const payload = {
      manifestSection: { enabled: false, audience: 'registered' },
    };

    const res = await request(app)
      .put('/api/homepage-settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .set(csrfHeadersFor('csrf-homepage-admin', adminId))
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.manifestSection).toEqual(payload.manifestSection);
    expect(res.body.data.infoSection).toBeUndefined();
  });

  it('PUT should validate object payloads', async () => {
    const res = await request(app)
      .put('/api/homepage-settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .set(csrfHeadersFor('csrf-homepage-admin-2', adminId))
      .send({ manifestSection: [] });
    expect(res.status).toBe(400);
  });
});
