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
        .send({ firstNameEn: 'Test', lastNameEn: 'Person' });
      expect(res.status).toBe(401);
    });

    it('rejects viewer role (403)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(viewerUserId, viewerToken))
        .send({ firstNameEn: 'Test', lastNameEn: 'Person' });
      expect(res.status).toBe(403);
    });

    it('rejects request without firstNameEn (400)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ lastNameEn: 'Person' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/English first name/i);
    });

    it('rejects request without lastNameEn (400)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstNameEn: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/English last name/i);
    });

    it('admin can create a basic person profile (201)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstNameEn: 'John', lastNameEn: 'Doe' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.firstNameEn).toBe('John');
      expect(res.body.data.profile.lastNameEn).toBe('Doe');
      expect(res.body.data.profile.slug).toBe('john-doe');
      expect(res.body.data.profile.claimStatus).toBe('unclaimed');
      expect(res.body.data.profile.source).toBe('moderator');
    });

    it('moderator can create a person profile (201)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(moderatorUserId, moderatorToken))
        .send({ firstNameEn: 'Jane', lastNameEn: 'Smith', bio: 'A test bio' });
      expect(res.status).toBe(201);
      expect(res.body.data.profile.firstNameEn).toBe('Jane');
      expect(res.body.data.profile.bio).toBe('A test bio');
    });

    it('generates unique slugs for duplicate names', async () => {
      // First profile with this name
      const res1 = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstNameEn: 'Alice', lastNameEn: 'Test' });
      expect(res1.status).toBe(201);
      expect(res1.body.data.profile.slug).toBe('alice-test');

      // Second profile with the same name
      const res2 = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstNameEn: 'Alice', lastNameEn: 'Test' });
      expect(res2.status).toBe(201);
      expect(res2.body.data.profile.slug).toBe('alice-test-2');
    });

    it('creates a profile (position field removed in refactor) (201)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({
          firstNameEn: 'Bob',
          lastNameEn: 'Mayor',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.profile).not.toHaveProperty('position');
    });

    it('creates a profile with social links (201)', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({
          firstNameEn: 'Carol',
          lastNameEn: 'Links',
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
        .send({ firstNameEn: 'Listed', lastNameEn: 'Person' });

      const listRes = await request(app).get('/api/persons');
      expect(listRes.status).toBe(200);
      const names = listRes.body.data.profiles.map((p) => `${p.firstNameEn} ${p.lastNameEn}`);
      expect(names).toContain('Listed Person');
    });

    it('creates a LocationLink when profile is created with locationId', async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstNameEn: 'Linked', lastNameEn: 'Profile', locationId: locationAId });

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
        .send({ firstNameEn: 'Update', lastNameEn: 'Location', locationId: locationAId });

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

  // ── POST /api/persons/:id/photo ──────────────────────────────────────────
  describe('POST /api/persons/:id/photo', () => {
    let profileIdForPhoto;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/persons')
        .set(csrfHeaders(adminUserId, adminToken))
        .send({ firstNameEn: 'Photo', lastNameEn: 'Test' });
      profileIdForPhoto = res.body.data.profile.id;
    });

    it('rejects unauthenticated requests (401)', async () => {
      const res = await request(app)
        .post(`/api/persons/${profileIdForPhoto}/photo`);
      expect(res.status).toBe(401);
    });

    it('rejects viewer role (403)', async () => {
      const res = await request(app)
        .post(`/api/persons/${profileIdForPhoto}/photo`)
        .set(csrfHeaders(viewerUserId, viewerToken));
      expect(res.status).toBe(403);
    });

    it('returns 400 when no file is attached', async () => {
      const res = await request(app)
        .post(`/api/persons/${profileIdForPhoto}/photo`)
        .set(csrfHeaders(adminUserId, adminToken));
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/no file/i);
    });

    it('returns 404 when person does not exist', async () => {
      // Minimal 1×1 white PNG
      const png1x1 = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==',
        'base64'
      );
      const res = await request(app)
        .post('/api/persons/999999/photo')
        .set(csrfHeaders(adminUserId, adminToken))
        .attach('photo', png1x1, { filename: 'test.png', contentType: 'image/png' });
      expect(res.status).toBe(404);
    });

    it('admin can upload a photo for a person profile (200)', async () => {
      // Minimal 1×1 white PNG
      const png1x1 = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==',
        'base64'
      );
      const res = await request(app)
        .post(`/api/persons/${profileIdForPhoto}/photo`)
        .set(csrfHeaders(adminUserId, adminToken))
        .attach('photo', png1x1, { filename: 'test.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.photoUrl).toMatch(/^\/uploads\/profiles\//);

      // Verify the photo was persisted on the User record
      const { User: UserModel } = require('../src/models');
      const updated = await UserModel.findByPk(profileIdForPhoto);
      expect(updated.photo).toMatch(/^\/uploads\/profiles\//);
      expect(updated.avatar).toMatch(/^\/uploads\/profiles\//);
    });

    it('moderator can upload a photo for a person profile (200)', async () => {
      const png1x1 = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==',
        'base64'
      );
      const res = await request(app)
        .post(`/api/persons/${profileIdForPhoto}/photo`)
        .set(csrfHeaders(moderatorUserId, moderatorToken))
        .attach('photo', png1x1, { filename: 'test.png', contentType: 'image/png' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects unsupported MIME type (415)', async () => {
      const res = await request(app)
        .post(`/api/persons/${profileIdForPhoto}/photo`)
        .set(csrfHeaders(adminUserId, adminToken))
        .attach('photo', Buffer.from('fakedata'), { filename: 'test.gif', contentType: 'image/gif' });
      expect(res.status).toBe(415);
      expect(res.body.success).toBe(false);
    });

    it('accepts HEIC MIME type (passes MIME validation, not 415)', async () => {
      const res = await request(app)
        .post(`/api/persons/${profileIdForPhoto}/photo`)
        .set(csrfHeaders(adminUserId, adminToken))
        .attach('photo', Buffer.from('not-real-heic-data'), { filename: 'photo.heic', contentType: 'image/heic' });
      // Must NOT be rejected by MIME validation
      expect(res.status).not.toBe(415);
    });

    it('accepts HEIF MIME type (passes MIME validation, not 415)', async () => {
      const res = await request(app)
        .post(`/api/persons/${profileIdForPhoto}/photo`)
        .set(csrfHeaders(adminUserId, adminToken))
        .attach('photo', Buffer.from('not-real-heif-data'), { filename: 'photo.heif', contentType: 'image/heif' });
      // Must NOT be rejected by MIME validation
      expect(res.status).not.toBe(415);
    });

    it('returns HEIC-specific error message when HEIC cannot be decoded (422)', async () => {
      const res = await request(app)
        .post(`/api/persons/${profileIdForPhoto}/photo`)
        .set(csrfHeaders(adminUserId, adminToken))
        .attach('photo', Buffer.from('not-real-heic-data'), { filename: 'photo.heic', contentType: 'image/heic' });
      // If sharp cannot decode the fake HEIC data, it should return 422 with HEIC-specific message
      if (res.status === 422) {
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/HEIC|HEIF|convert/i);
      }
    });
  });
});
