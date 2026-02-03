const request = require('supertest');
const { sequelize, User, Location, LocationLink, Article } = require('../src/models');

// Create a test app instance
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');

const authRoutes = require('../src/routes/authRoutes');
const locationRoutes = require('../src/routes/locationRoutes');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);

describe('Location API Tests', () => {
  let adminToken;
  let moderatorToken;
  let viewerToken;
  let adminUserId;
  let moderatorUserId;
  let viewerUserId;
  let greeceId;
  let atticaId;
  let athensId;

  const csrfHeaderFor = (token) => ({
    Cookie: [`csrf_token=${token}`],
    'x-csrf-token': token
  });

  const setCsrfToken = (token, userId) => {
    const { storeCsrfToken } = require('../src/utils/csrf');
    storeCsrfToken(token, userId);
  };

  beforeAll(async () => {
    // Connect to test database and sync models
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // Create test users
    const admin = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    });
    adminUserId = admin.id;

    const moderator = await User.create({
      username: 'moderator',
      email: 'moderator@test.com',
      password: 'mod123',
      role: 'moderator',
      firstName: 'Moderator',
      lastName: 'User'
    });
    moderatorUserId = moderator.id;

    const viewer = await User.create({
      username: 'viewer',
      email: 'viewer@test.com',
      password: 'viewer123',
      role: 'viewer',
      firstName: 'Viewer',
      lastName: 'User'
    });
    viewerUserId = viewer.id;

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    const adminCookie = adminLogin.headers['set-cookie'].find((cookie) => cookie.startsWith('auth_token='));
    adminToken = adminCookie.split(';')[0].replace('auth_token=', '');

    const modLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'moderator@test.com', password: 'mod123' });
    const modCookie = modLogin.headers['set-cookie'].find((cookie) => cookie.startsWith('auth_token='));
    moderatorToken = modCookie.split(';')[0].replace('auth_token=', '');

    const viewerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'viewer@test.com', password: 'viewer123' });
    const viewerCookie = viewerLogin.headers['set-cookie'].find((cookie) => cookie.startsWith('auth_token='));
    viewerToken = viewerCookie.split(';')[0].replace('auth_token=', '');

    // Create sample locations for testing
    const greece = await Location.create({
      name: 'Greece',
      name_local: 'Ελλάδα',
      type: 'country',
      code: 'GR',
      slug: 'greece',
      lat: 39.0742,
      lng: 21.8243
    });
    greeceId = greece.id;

    const attica = await Location.create({
      name: 'Attica',
      name_local: 'Αττική',
      type: 'prefecture',
      code: 'GR-A',
      parent_id: greeceId,
      slug: 'greece-attica',
      lat: 38.0756,
      lng: 23.8156
    });
    atticaId = attica.id;

    const athens = await Location.create({
      name: 'Athens',
      name_local: 'Αθήνα',
      type: 'municipality',
      parent_id: atticaId,
      slug: 'greece-attica-athens',
      lat: 37.9838,
      lng: 23.7275
    });
    athensId = athens.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Public Location Endpoints', () => {
    test('should get all locations', async () => {
      const response = await request(app)
        .get('/api/locations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(3);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should filter locations by type', async () => {
      const response = await request(app)
        .get('/api/locations?type=country')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(loc => loc.type === 'country')).toBe(true);
    });

    test('should filter locations by parent_id', async () => {
      const response = await request(app)
        .get(`/api/locations?parent_id=${greeceId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(loc => loc.parent_id === greeceId)).toBe(true);
    });

    test('should get location by id', async () => {
      const response = await request(app)
        .get(`/api/locations/${athensId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Athens');
      expect(response.body.data.type).toBe('municipality');
    });

    test('should get location by slug', async () => {
      const response = await request(app)
        .get('/api/locations/greece-attica-athens')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Athens');
    });

    test('should include children when requested', async () => {
      const response = await request(app)
        .get(`/api/locations/${greeceId}?include_children=true`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.children).toBeInstanceOf(Array);
      expect(response.body.data.children.length).toBeGreaterThan(0);
    });
  });

  describe('Location CRUD (Admin/Moderator)', () => {
    test('should allow admin to create location', async () => {
      const csrfToken = 'test-csrf-token-admin-create';
      setCsrfToken(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/locations')
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({
          name: 'Thessaloniki',
          name_local: 'Θεσσαλονίκη',
          type: 'prefecture',
          parent_id: greeceId,
          code: 'GR-B',
          lat: 40.6401,
          lng: 22.9444
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Thessaloniki');
      expect(response.body.data.parent_id).toBe(greeceId);
    });

    test('should allow moderator to create location', async () => {
      const csrfToken = 'test-csrf-token-mod-create';
      setCsrfToken(csrfToken, moderatorUserId);

      const response = await request(app)
        .post('/api/locations')
        .set('Cookie', [`auth_token=${moderatorToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({
          name: 'Crete',
          name_local: 'Κρήτη',
          type: 'prefecture',
          parent_id: greeceId,
          code: 'GR-M',
          lat: 35.2401,
          lng: 24.8093
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Crete');
    });

    test('should prevent viewer from creating location', async () => {
      const csrfToken = 'test-csrf-token-viewer-create';
      setCsrfToken(csrfToken, viewerUserId);

      await request(app)
        .post('/api/locations')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({
          name: 'Test Location',
          type: 'municipality',
          parent_id: greeceId
        })
        .expect(403);
    });

    test('should prevent duplicate locations', async () => {
      const csrfToken = 'test-csrf-token-admin-dup';
      setCsrfToken(csrfToken, adminUserId);

      await request(app)
        .post('/api/locations')
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({
          name: 'Athens',
          type: 'municipality',
          parent_id: atticaId
        })
        .expect(400);
    });

    test('should allow admin to update location', async () => {
      const csrfToken = 'test-csrf-token-admin-update';
      setCsrfToken(csrfToken, adminUserId);

      const response = await request(app)
        .put(`/api/locations/${athensId}`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({
          lat: 37.9839,
          lng: 23.7276
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(parseFloat(response.body.data.lat)).toBe(37.9839);
    });

    test('should allow admin to delete location without children or links', async () => {
      const csrfToken = 'test-csrf-token-admin-delete';
      setCsrfToken(csrfToken, adminUserId);

      // Create a location to delete
      const createRes = await request(app)
        .post('/api/locations')
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({
          name: 'Temp Location',
          type: 'municipality',
          parent_id: atticaId,
          slug: 'temp-location-to-delete'
        })
        .expect(201);

      const locationId = createRes.body.data.id;

      // Delete it
      const response = await request(app)
        .delete(`/api/locations/${locationId}`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should prevent deleting location with children', async () => {
      const csrfToken = 'test-csrf-token-admin-delete-parent';
      setCsrfToken(csrfToken, adminUserId);

      await request(app)
        .delete(`/api/locations/${atticaId}`)
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .expect(400);
    });
  });

  describe('Location Linking', () => {
    let articleId;

    beforeAll(async () => {
      // Create a test article
      const article = await Article.create({
        title: 'Test Article',
        content: 'Test content for location linking',
        authorId: adminUserId,
        status: 'published',
        type: 'personal'
      });
      articleId = article.id;
    });

    test('should link location to article', async () => {
      const csrfToken = 'test-csrf-token-link';
      setCsrfToken(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/locations/link')
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({
          location_id: athensId,
          entity_type: 'article',
          entity_id: articleId
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should get linked locations for an article', async () => {
      const response = await request(app)
        .get(`/api/locations/links/entity?entity_type=article&entity_id=${articleId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
      expect(response.body.data.some(loc => loc.id === athensId)).toBe(true);
    });

    test('should unlink location from article', async () => {
      const csrfToken = 'test-csrf-token-unlink';
      setCsrfToken(csrfToken, adminUserId);

      const response = await request(app)
        .post('/api/locations/unlink')
        .set('Cookie', [`auth_token=${adminToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({
          location_id: athensId,
          entity_type: 'article',
          entity_id: articleId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should update user home location', async () => {
      const csrfToken = 'test-csrf-token-profile';
      setCsrfToken(csrfToken, viewerUserId);

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${csrfToken}`])
        .set('x-csrf-token', csrfToken)
        .send({
          home_location_id: athensId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.home_location_id).toBe(athensId);
    });

    test('should get user profile with home location', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Cookie', [`auth_token=${viewerToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.homeLocation).toBeDefined();
      expect(response.body.data.user.homeLocation.id).toBe(athensId);
    });
  });
});
