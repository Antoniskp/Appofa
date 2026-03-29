const request = require('supertest');
const { sequelize, User, PublicPersonProfile, Location } = require('../src/models');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');

const authRoutes = require('../src/routes/authRoutes');
const personRoutes = require('../src/routes/personRoutes');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/persons', personRoutes);

describe('Person Profile Tests (POST /api/persons)', () => {
  let adminToken, adminUserId;
  let moderatorToken, moderatorUserId;
  let viewerToken, viewerUserId;

  const csrfToken = 'test-csrf-token-persons';

  const csrfHeaders = (userId, authToken) => {
    const { storeCsrfToken } = require('../src/utils/csrf');
    storeCsrfToken(csrfToken, userId);
    return {
      Cookie: [`csrf_token=${csrfToken}`, `auth_token=${authToken}`],
      'x-csrf-token': csrfToken
    };
  };

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const registerAndLogin = async (username, role) => {
      await request(app).post('/api/auth/register').send({
        username,
        email: `${username}@test.com`,
        password: 'Test1234!'
      });
      const user = await User.findOne({ where: { username } });
      if (role !== 'viewer') {
        await User.update({ role }, { where: { id: user.id } });
      }
      const loginRes = await request(app).post('/api/auth/login').send({
        email: `${username}@test.com`,
        password: 'Test1234!'
      });
      const authCookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('auth_token='));
      const token = authCookie.split(';')[0].replace('auth_token=', '');
      return { token, id: user.id };
    };

    ({ token: adminToken, id: adminUserId } = await registerAndLogin('persons_admin', 'admin'));
    ({ token: moderatorToken, id: moderatorUserId } = await registerAndLogin('persons_mod', 'moderator'));
    ({ token: viewerToken, id: viewerUserId } = await registerAndLogin('persons_viewer', 'viewer'));
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── GET /api/persons ─────────────────────────────────────────────────────

  describe('GET /api/persons', () => {
    it('returns empty list when no profiles exist', async () => {
      const res = await request(app).get('/api/persons');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.profiles)).toBe(true);
    });
  });

  // ── POST /api/persons ────────────────────────────────────────────────────

  describe('POST /api/persons', () => {
    it('rejects unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/persons')
        .send({ firstName: 'Test', lastName: 'Person' });
      expect(res.status).toBe(401);
    });

    it('rejects viewer role (403)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(viewerUserId, viewerToken))
        .send({ firstName: 'Test', lastName: 'Person' });
      expect(res.status).toBe(403);
    });

    it('rejects request without firstName (400)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ lastName: 'Person' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/First name/i);
    });

    it('rejects request without lastName (400)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstName: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Last name/i);
    });

    it('admin can create a basic person profile (201)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstName: 'John', lastName: 'Doe' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.firstName).toBe('John');
      expect(res.body.data.profile.lastName).toBe('Doe');
      expect(res.body.data.profile.slug).toBe('john-doe');
      expect(res.body.data.profile.claimStatus).toBe('unclaimed');
      expect(res.body.data.profile.source).toBe('moderator');
    });

    it('moderator can create a person profile (201)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(moderatorUserId, moderatorToken))
        .send({ firstName: 'Jane', lastName: 'Smith', bio: 'A test bio' });
      expect(res.status).toBe(201);
      expect(res.body.data.profile.firstName).toBe('Jane');
      expect(res.body.data.profile.bio).toBe('A test bio');
    });

    it('generates unique slugs for duplicate names', async () => {
      // First profile with this name
      const res1 = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstName: 'Alice', lastName: 'Test' });
      expect(res1.status).toBe(201);
      expect(res1.body.data.profile.slug).toBe('alice-test');

      // Second profile with the same name
      const res2 = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstName: 'Alice', lastName: 'Test' });
      expect(res2.status).toBe(201);
      expect(res2.body.data.profile.slug).toBe('alice-test-2');
    });

    it('creates a profile with candidate position (201)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({
          firstName: 'Bob',
          lastName: 'Mayor',
          position: 'mayor'
        });
      expect(res.status).toBe(201);
      expect(res.body.data.profile.position).toBe('mayor');
    });

    it('creates a profile with social links (201)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({
          firstName: 'Carol',
          lastName: 'Links',
          socialLinks: { website: 'https://example.com', x: 'https://x.com/carol' }
        });
      expect(res.status).toBe(201);
      expect(res.body.data.profile.socialLinks).toEqual({
        website: 'https://example.com',
        x: 'https://x.com/carol'
      });
    });

    it('newly created profile appears in GET /api/persons listing', async () => {
      await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstName: 'Listed', lastName: 'Person' });

      const listRes = await request(app).get('/api/persons');
      expect(listRes.status).toBe(200);
      const names = listRes.body.data.profiles.map((p) => `${p.firstName} ${p.lastName}`);
      expect(names).toContain('Listed Person');
    });
  });
});
