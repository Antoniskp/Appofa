const request = require('supertest');
const { sequelize, User, PublicPersonProfile, Location, LocationLink } = require('../src/models');

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
  let locationAId, locationBId;

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

    const [locationA, locationB] = await Promise.all([
      Location.create({ name: 'Persons Test Location A', slug: 'persons-test-location-a', type: 'municipality' }),
      Location.create({ name: 'Persons Test Location B', slug: 'persons-test-location-b', type: 'municipality' })
    ]);
    locationAId = locationA.id;
    locationBId = locationB.id;
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
        .send({ firstNameNative: 'Test', lastNameNative: 'Person' });
      expect(res.status).toBe(401);
    });

    it('rejects viewer role (403)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(viewerUserId, viewerToken))
        .send({ firstNameNative: 'Test', lastNameNative: 'Person' });
      expect(res.status).toBe(403);
    });

    it('rejects request without firstNameNative (400)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ lastNameNative: 'Person' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/First name/i);
    });

    it('rejects request without lastNameNative (400)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstNameNative: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Last name/i);
    });

    it('admin can create a basic person profile (201)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstNameNative: 'John', lastNameNative: 'Doe' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.firstNameNative).toBe('John');
      expect(res.body.data.profile.lastNameNative).toBe('Doe');
      expect(res.body.data.profile.slug).toBe('john-doe');
      expect(res.body.data.profile.claimStatus).toBe('unclaimed');
      expect(res.body.data.profile.source).toBe('moderator');
    });

    it('moderator can create a person profile (201)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(moderatorUserId, moderatorToken))
        .send({ firstNameNative: 'Jane', lastNameNative: 'Smith', bio: 'A test bio' });
      expect(res.status).toBe(201);
      expect(res.body.data.profile.firstNameNative).toBe('Jane');
      expect(res.body.data.profile.bio).toBe('A test bio');
    });

    it('generates unique slugs for duplicate names', async () => {
      // First profile with this name
      const res1 = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstNameNative: 'Alice', lastNameNative: 'Test' });
      expect(res1.status).toBe(201);
      expect(res1.body.data.profile.slug).toBe('alice-test');

      // Second profile with the same name
      const res2 = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstNameNative: 'Alice', lastNameNative: 'Test' });
      expect(res2.status).toBe(201);
      expect(res2.body.data.profile.slug).toBe('alice-test-2');
    });

    it('creates a profile (position field removed in refactor) (201)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({
          firstNameNative: 'Bob',
          lastNameNative: 'Mayor',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.profile).not.toHaveProperty('position');
    });

    it('creates a profile with social links (201)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({
          firstNameNative: 'Carol',
          lastNameNative: 'Links',
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
        .send({ firstNameNative: 'Listed', lastNameNative: 'Person' });

      const listRes = await request(app).get('/api/persons');
      expect(listRes.status).toBe(200);
      const names = listRes.body.data.profiles.map((p) => `${p.firstNameNative} ${p.lastNameNative}`);
      expect(names).toContain('Listed Person');
    });

    it('creates a LocationLink when profile is created with locationId', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstNameNative: 'Linked', lastNameNative: 'Profile', locationId: locationAId });

      expect(res.status).toBe(201);
      const profileId = res.body.data.profile.id;
      const link = await LocationLink.findOne({
        where: { entity_type: 'user', entity_id: profileId }
      });

      expect(link).not.toBeNull();
      expect(link.location_id).toBe(locationAId);
    });
  });

  describe('PUT /api/persons/:id', () => {
    it('updates LocationLink when profile homeLocationId changes', async () => {
      const createRes = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstNameNative: 'Update', lastNameNative: 'Location', locationId: locationAId });

      expect(createRes.status).toBe(201);
      const profileId = createRes.body.data.profile.id;

      const updateRes = await request(app)
        .put(`/api/persons/${profileId}`)
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ homeLocationId: locationBId });

      expect(updateRes.status).toBe(200);

      const links = await LocationLink.findAll({
        where: { entity_type: 'user', entity_id: profileId }
      });

      expect(links.length).toBe(1);
      expect(links[0].location_id).toBe(locationBId);
    });
  });
});
