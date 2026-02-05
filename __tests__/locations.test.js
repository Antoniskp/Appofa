const request = require('supertest');
const app = require('../src/index');
const { sequelize, User, Location, LocationLink, Article } = require('../src/models');

describe('Location API Tests', () => {
  let adminToken;
  let editorToken;
  let viewerToken;
  let testLocation;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test users
    const admin = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    const editor = await User.create({
      username: 'editor',
      email: 'editor@test.com',
      password: 'password123',
      role: 'editor'
    });

    const viewer = await User.create({
      username: 'viewer',
      email: 'viewer@test.com',
      password: 'password123',
      role: 'viewer'
    });

    // Login users
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.headers['set-cookie'].find(c => c.startsWith('auth_token=')).split(';')[0].replace('auth_token=', '');

    const editorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'editor@test.com', password: 'password123' });
    editorToken = editorLogin.headers['set-cookie'].find(c => c.startsWith('auth_token=')).split(';')[0].replace('auth_token=', '');

    const viewerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'viewer@test.com', password: 'password123' });
    viewerToken = viewerLogin.headers['set-cookie'].find(c => c.startsWith('auth_token=')).split(';')[0].replace('auth_token=', '');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/locations', () => {
    it('should list locations without authentication', async () => {
      const response = await request(app)
        .get('/api/locations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.locations)).toBe(true);
    });
  });

  describe('POST /api/locations', () => {
    it('should create location as admin', async () => {
      const response = await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'Greece',
          type: 'country',
          code: 'GR',
          lat: 39.0742,
          lng: 21.8243
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.location.name).toBe('Greece');
      testLocation = response.body.location;
    });

    it('should not create location as viewer', async () => {
      const response = await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${viewerToken}`)
        .send({
          name: 'Italy',
          type: 'country',
          code: 'IT'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should prevent duplicate locations', async () => {
      await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'France',
          type: 'country',
          code: 'FR'
        })
        .expect(201);

      const response = await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'France',
          type: 'country',
          code: 'FR'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should create location with Wikipedia URL', async () => {
      const response = await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'Japan',
          type: 'country',
          code: 'JP',
          wikipedia_url: 'https://en.wikipedia.org/wiki/Japan'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.location.name).toBe('Japan');
      expect(response.body.location.wikipedia_url).toBe('https://en.wikipedia.org/wiki/Japan');
    });
  });

  describe('GET /api/locations/:id', () => {
    it('should get location by id', async () => {
      const response = await request(app)
        .get(`/api/locations/${testLocation.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.location.name).toBe('Greece');
    });
  });

  describe('PUT /api/locations/:id', () => {
    it('should update location as admin', async () => {
      const response = await request(app)
        .put(`/api/locations/${testLocation.id}`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'Hellenic Republic',
          name_local: 'Ελλάδα'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.location.name).toBe('Hellenic Republic');
    });

    it('should update location Wikipedia URL as admin', async () => {
      const response = await request(app)
        .put(`/api/locations/${testLocation.id}`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          wikipedia_url: 'https://en.wikipedia.org/wiki/Greece'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.location.wikipedia_url).toBe('https://en.wikipedia.org/wiki/Greece');
    });
  });

  describe('Hierarchical locations', () => {
    let countryId;
    let prefectureId;

    it('should create hierarchical locations', async () => {
      const country = await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'Japan',
          type: 'country',
          code: 'JP'
        })
        .expect(201);

      countryId = country.body.location.id;

      const prefecture = await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'Tokyo',
          type: 'prefecture',
          parent_id: countryId
        })
        .expect(201);

      prefectureId = prefecture.body.location.id;
      expect(prefecture.body.location.parent_id).toBe(countryId);
    });

    it('should get location with children', async () => {
      const response = await request(app)
        .get(`/api/locations/${countryId}`)
        .expect(200);

      expect(response.body.location.children).toBeDefined();
      expect(response.body.location.children.length).toBeGreaterThan(0);
    });
  });

  describe('Location linking', () => {
    let articleId;
    let userId;

    beforeAll(async () => {
      // Create test article
      const article = await Article.create({
        title: 'Test Article',
        content: 'Test content for location linking',
        authorId: 1,
        status: 'published'
      });
      articleId = article.id;
      userId = 1; // admin user
    });

    it('should link location to article', async () => {
      const response = await request(app)
        .post('/api/locations/link')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          location_id: testLocation.id,
          entity_type: 'article',
          entity_id: articleId
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should prevent duplicate links', async () => {
      const response = await request(app)
        .post('/api/locations/link')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          location_id: testLocation.id,
          entity_type: 'article',
          entity_id: articleId
        })
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should get entity locations', async () => {
      const response = await request(app)
        .get(`/api/locations/article/${articleId}/locations`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.locations.length).toBeGreaterThan(0);
    });

    it('should get location entities', async () => {
      const response = await request(app)
        .get(`/api/locations/${testLocation.id}/entities`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.articles.length).toBeGreaterThan(0);
    });

    it('should unlink location', async () => {
      const response = await request(app)
        .post('/api/locations/unlink')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          location_id: testLocation.id,
          entity_type: 'article',
          entity_id: articleId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/locations/:id', () => {
    it('should not delete location with children', async () => {
      // Create parent location
      const parent = await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'Spain',
          type: 'country',
          code: 'ES'
        })
        .expect(201);

      // Create child location
      await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'Madrid',
          type: 'prefecture',
          parent_id: parent.body.location.id
        })
        .expect(201);

      // Try to delete parent
      const response = await request(app)
        .delete(`/api/locations/${parent.body.location.id}`)
        .set('Cookie', `auth_token=${adminToken}`)
        .expect(400);

      expect(response.body.message).toContain('child');
    });

    it('should delete location as admin', async () => {
      const loc = await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'Portugal',
          type: 'country',
          code: 'PT'
        })
        .expect(201);

      const response = await request(app)
        .delete(`/api/locations/${loc.body.location.id}`)
        .set('Cookie', `auth_token=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
