const request = require('supertest');
const app = require('../src/index');
const { sequelize, User, Location, LocationLink, Article } = require('../src/models');

describe('Location API Tests', () => {
  let adminToken;
  let editorToken;
  let viewerToken;
  let viewerCsrfToken;
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
    viewerCsrfToken = viewerLogin.headers['set-cookie'].find(c => c.startsWith('csrf_token=')).split(';')[0].replace('csrf_token=', '');
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

    it('should sort locations by most users with name as tie-breaker', async () => {
      const [alpha, beta, gamma] = await Promise.all([
        Location.create({ name: 'Alpha Users', slug: 'alpha-users', type: 'prefecture' }),
        Location.create({ name: 'Beta Users', slug: 'beta-users', type: 'prefecture' }),
        Location.create({ name: 'Gamma Users', slug: 'gamma-users', type: 'prefecture' })
      ]);

      const [u1, u2, u3, u4, u5] = await Promise.all([
        User.create({ username: 'locsortuser1', email: 'locsortuser1@test.com', password: 'password123', role: 'viewer' }),
        User.create({ username: 'locsortuser2', email: 'locsortuser2@test.com', password: 'password123', role: 'viewer' }),
        User.create({ username: 'locsortuser3', email: 'locsortuser3@test.com', password: 'password123', role: 'viewer' }),
        User.create({ username: 'locsortuser4', email: 'locsortuser4@test.com', password: 'password123', role: 'viewer' }),
        User.create({ username: 'locsortuser5', email: 'locsortuser5@test.com', password: 'password123', role: 'viewer' })
      ]);

      await Promise.all([
        LocationLink.create({ location_id: alpha.id, entity_type: 'user', entity_id: u1.id }),
        LocationLink.create({ location_id: beta.id, entity_type: 'user', entity_id: u2.id }),
        LocationLink.create({ location_id: beta.id, entity_type: 'user', entity_id: u3.id }),
        LocationLink.create({ location_id: gamma.id, entity_type: 'user', entity_id: u4.id }),
        LocationLink.create({ location_id: gamma.id, entity_type: 'user', entity_id: u5.id })
      ]);

      const response = await request(app)
        .get('/api/locations')
        .query({ sort: 'mostUsers', limit: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.locations).toHaveLength(3);
      expect(response.body.locations.map((location) => location.name)).toEqual([
        'Beta Users',
        'Gamma Users',
        'Alpha Users'
      ]);
      expect(response.body.locations.map((location) => location.userCount)).toEqual([2, 2, 1]);
      expect(response.body.locations[0].userCount).toEqual(expect.any(Number));
    });

    it('should include searchable home-location users once in most users count', async () => {
      const [alpha, beta] = await Promise.all([
        Location.create({ name: 'MostUsersUnion Alpha', slug: 'mostusersunion-alpha', type: 'international' }),
        Location.create({ name: 'MostUsersUnion Beta', slug: 'mostusersunion-beta', type: 'international' })
      ]);

      const [linkedAndHome, homeOnlySearchable, homeOnlyNotSearchable, betaLinked] = await Promise.all([
        User.create({
          username: 'mostusersunion_linked_home',
          email: 'mostusersunion_linked_home@test.com',
          password: 'password123',
          role: 'viewer',
          homeLocationId: alpha.id,
          searchable: true
        }),
        User.create({
          username: 'mostusersunion_home_only',
          email: 'mostusersunion_home_only@test.com',
          password: 'password123',
          role: 'viewer',
          homeLocationId: alpha.id,
          searchable: true
        }),
        User.create({
          username: 'mostusersunion_hidden_home',
          email: 'mostusersunion_hidden_home@test.com',
          password: 'password123',
          role: 'viewer',
          homeLocationId: alpha.id,
          searchable: false
        }),
        User.create({
          username: 'mostusersunion_beta_linked',
          email: 'mostusersunion_beta_linked@test.com',
          password: 'password123',
          role: 'viewer',
          searchable: true
        })
      ]);

      await Promise.all([
        LocationLink.create({ location_id: alpha.id, entity_type: 'user', entity_id: linkedAndHome.id }),
        LocationLink.create({ location_id: beta.id, entity_type: 'user', entity_id: betaLinked.id })
      ]);

      const response = await request(app)
        .get('/api/locations')
        .query({ sort: 'mostUsers', type: 'international', limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.locations).toHaveLength(2);
      expect(response.body.locations.map((location) => location.name)).toEqual([
        'MostUsersUnion Alpha',
        'MostUsersUnion Beta'
      ]);
      expect(response.body.locations.map((location) => location.userCount)).toEqual([2, 1]);
    });

    it('should aggregate descendant real users for parents and exclude unclaimed profiles', async () => {
      const country = await Location.create({ name: 'MostUsers Tree Country', slug: 'mostusers-tree-country', type: 'country' });
      const prefecture = await Location.create({ name: 'MostUsers Tree Prefecture', slug: 'mostusers-tree-prefecture', type: 'prefecture', parent_id: country.id });
      const municipality = await Location.create({ name: 'MostUsers Tree Municipality', slug: 'mostusers-tree-municipality', type: 'municipality', parent_id: prefecture.id });

      const [linkedReal, linkedUnclaimed, homeReal, homeUnclaimed] = await Promise.all([
        User.create({
          username: 'mostusers_tree_linked_real',
          email: 'mostusers_tree_linked_real@test.com',
          password: 'password123',
          role: 'viewer'
        }),
        User.create({
          username: 'mostusers_tree_linked_unclaimed',
          email: 'mostusers_tree_linked_unclaimed@placeholder.appofasi.gr',
          password: 'password123',
          role: 'viewer',
          claimStatus: 'unclaimed'
        }),
        User.create({
          username: 'mostusers_tree_home_real',
          email: 'mostusers_tree_home_real@test.com',
          password: 'password123',
          role: 'viewer',
          homeLocationId: municipality.id,
          searchable: true
        }),
        User.create({
          username: 'mostusers_tree_home_unclaimed',
          email: 'mostusers_tree_home_unclaimed@placeholder.appofasi.gr',
          password: 'password123',
          role: 'viewer',
          homeLocationId: municipality.id,
          searchable: true,
          claimStatus: 'unclaimed'
        })
      ]);

      await Promise.all([
        LocationLink.create({ location_id: municipality.id, entity_type: 'user', entity_id: linkedReal.id }),
        LocationLink.create({ location_id: municipality.id, entity_type: 'user', entity_id: linkedUnclaimed.id })
      ]);

      const response = await request(app)
        .get('/api/locations')
        .query({ sort: 'mostUsers', limit: 200 })
        .expect(200);

      expect(response.body.success).toBe(true);
      const treeLocations = response.body.locations.filter((location) =>
        [country.id, prefecture.id, municipality.id].includes(location.id)
      );
      expect(treeLocations).toHaveLength(3);

      const countsById = Object.fromEntries(treeLocations.map((location) => [location.id, location.userCount]));
      expect(countsById[country.id]).toBe(2);
      expect(countsById[prefecture.id]).toBe(2);
      expect(countsById[municipality.id]).toBe(2);
      expect(treeLocations.find((location) => location.id === municipality.id)?.parent?.id).toBe(prefecture.id);
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

    it('should reject invalid Wikipedia URL', async () => {
      const response = await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'TestCountry',
          type: 'country',
          wikipedia_url: 'https://example.com/fake-wiki'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid Wikipedia URL');
    });

    it('should accept empty Wikipedia URL', async () => {
      const response = await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'Germany',
          type: 'country',
          code: 'DE',
          wikipedia_url: ''
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.location.name).toBe('Germany');
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

    it('should aggregate subtree real users in stats and exclude unclaimed profiles', async () => {
      const parent = await Location.create({ name: 'Location Stats Parent', slug: 'location-stats-parent', type: 'country' });
      const child = await Location.create({ name: 'Location Stats Child', slug: 'location-stats-child', type: 'municipality', parent_id: parent.id });

      const [linkedHomeReal, linkedOnlyReal, homeOnlyReal, linkedUnclaimed, homeUnclaimed] = await Promise.all([
        User.create({
          username: 'locstats_linked_home_real',
          email: 'locstats_linked_home_real@test.com',
          password: 'password123',
          role: 'viewer',
          homeLocationId: child.id,
          searchable: true
        }),
        User.create({
          username: 'locstats_linked_only_real',
          email: 'locstats_linked_only_real@test.com',
          password: 'password123',
          role: 'viewer'
        }),
        User.create({
          username: 'locstats_home_only_real',
          email: 'locstats_home_only_real@test.com',
          password: 'password123',
          role: 'viewer',
          homeLocationId: child.id,
          searchable: true
        }),
        User.create({
          username: 'locstats_linked_unclaimed',
          email: 'locstats_linked_unclaimed@placeholder.appofasi.gr',
          password: 'password123',
          role: 'viewer',
          claimStatus: 'unclaimed'
        }),
        User.create({
          username: 'locstats_home_unclaimed',
          email: 'locstats_home_unclaimed@placeholder.appofasi.gr',
          password: 'password123',
          role: 'viewer',
          homeLocationId: child.id,
          searchable: true,
          claimStatus: 'unclaimed'
        })
      ]);

      await Promise.all([
        LocationLink.create({ location_id: child.id, entity_type: 'user', entity_id: linkedHomeReal.id }),
        LocationLink.create({ location_id: child.id, entity_type: 'user', entity_id: linkedOnlyReal.id }),
        LocationLink.create({ location_id: child.id, entity_type: 'user', entity_id: linkedUnclaimed.id })
      ]);

      const response = await request(app)
        .get(`/api/locations/${parent.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats.userCount).toBe(3);
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

    it('should reject invalid Wikipedia URL on update', async () => {
      const response = await request(app)
        .put(`/api/locations/${testLocation.id}`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          wikipedia_url: 'https://notawiki.com/page'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid Wikipedia URL');
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
          name: 'Hierarchy Test Country',
          type: 'country',
          code: 'HTC'
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

  describe('Moderator appears in location users tab', () => {
    let moderatorLocation;
    let moderatorUser;
    let unclaimedProfile;
    let moderatorToken;

    beforeAll(async () => {
      // Create a location for the moderator
      const locRes = await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({ name: 'ModeratorCity', type: 'municipality', code: 'MC' })
        .expect(201);
      moderatorLocation = locRes.body.location;

      // Create a moderator user with homeLocationId pointing to the location
      moderatorUser = await User.create({
        username: 'testmoderator',
        email: 'testmoderator@test.com',
        password: 'password123',
        role: 'moderator',
        homeLocationId: moderatorLocation.id,
        searchable: true
      });

      unclaimedProfile = await User.create({
        username: 'person-moderator-city',
        email: 'person-moderator-city@placeholder.appofasi.gr',
        password: 'password123',
        firstNameNative: 'Αδιεκδίκητο',
        lastNameNative: 'Πρόσωπο',
        claimStatus: 'unclaimed',
        slug: 'adiekdikito-prosopo',
        searchable: true
      });

      await LocationLink.create({
        location_id: moderatorLocation.id,
        entity_type: 'user',
        entity_id: unclaimedProfile.id
      });

      const modLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testmoderator@test.com', password: 'password123' });
      moderatorToken = modLogin.headers['set-cookie']
        .find(c => c.startsWith('auth_token='))
        .split(';')[0]
        .replace('auth_token=', '');
    });

    it('should show moderator in location users tab via homeLocationId', async () => {
      const response = await request(app)
        .get(`/api/locations/${moderatorLocation.id}/entities`)
        .set('Cookie', `auth_token=${moderatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users).toBeDefined();
      const mod = response.body.users.find(u => u.id === moderatorUser.id);
      expect(mod).toBeDefined();
      expect(mod.username).toBe('testmoderator');
    });

    it('should count moderator in usersCount stat for the location', async () => {
      const response = await request(app)
        .get(`/api/locations/${moderatorLocation.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats.userCount).toBeGreaterThanOrEqual(1);
    });

    it('should not duplicate moderator if also linked via LocationLink', async () => {
      // Also link the moderator via LocationLink
      await LocationLink.findOrCreate({
        where: {
          location_id: moderatorLocation.id,
          entity_type: 'user',
          entity_id: moderatorUser.id
        }
      });

      const response = await request(app)
        .get(`/api/locations/${moderatorLocation.id}/entities`)
        .set('Cookie', `auth_token=${moderatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const modUsers = response.body.users.filter(u => u.id === moderatorUser.id);
      expect(modUsers.length).toBe(1);

      // Clean up
      await LocationLink.destroy({
        where: { location_id: moderatorLocation.id, entity_type: 'user', entity_id: moderatorUser.id }
      });
    });

    it('should not show moderator with searchable=false in users tab', async () => {
      await moderatorUser.update({ searchable: false });

      const response = await request(app)
        .get(`/api/locations/${moderatorLocation.id}/entities`)
        .set('Cookie', `auth_token=${moderatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const mod = response.body.users.find(u => u.id === moderatorUser.id);
      expect(mod).toBeUndefined();

      // Restore
      await moderatorUser.update({ searchable: true });
    });

    it('should split regular users and unclaimed person profiles in entities payload', async () => {
      const response = await request(app)
        .get(`/api/locations/${moderatorLocation.id}/entities`)
        .set('Cookie', `auth_token=${moderatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users.find(u => u.id === moderatorUser.id)).toBeDefined();
      expect(response.body.users.find(u => u.id === unclaimedProfile.id)).toBeUndefined();
      const foundUnclaimed = response.body.unclaimed.find(u => u.id === unclaimedProfile.id);
      expect(foundUnclaimed).toBeDefined();
      expect(response.body.unclaimedCount).toBeGreaterThanOrEqual(1);
      expect(foundUnclaimed).toHaveProperty('photo');
      expect(foundUnclaimed).toHaveProperty('slug');
    });
  });

  describe('User homeLocationId syncing with LocationLinks', () => {
    let testLocationForSync;
    let anotherTestLocation;
    let testUserId;

    beforeAll(async () => {
      // Create test locations for syncing
      const loc1 = await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'TestCity1',
          type: 'municipality',
          code: 'TC1'
        })
        .expect(201);
      testLocationForSync = loc1.body.location;

      const loc2 = await request(app)
        .post('/api/locations')
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          name: 'TestCity2',
          type: 'municipality',
          code: 'TC2'
        })
        .expect(201);
      anotherTestLocation = loc2.body.location;

      // Use the viewer user for testing
      const viewer = await User.findOne({ where: { email: 'viewer@test.com' } });
      testUserId = viewer.id;
    });

    it('should create LocationLink when setting homeLocationId', async () => {
      // Update user profile with homeLocationId
      await request(app)
        .put('/api/auth/profile')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${viewerCsrfToken}`])
        .set('x-csrf-token', viewerCsrfToken)
        .send({
          homeLocationId: testLocationForSync.id,
          searchable: true
        })
        .expect(200);

      // Verify LocationLink was created
      const link = await LocationLink.findOne({
        where: {
          entity_type: 'user',
          entity_id: testUserId,
          location_id: testLocationForSync.id
        }
      });

      expect(link).not.toBeNull();
      expect(link.location_id).toBe(testLocationForSync.id);
      expect(link.entity_type).toBe('user');
      expect(link.entity_id).toBe(testUserId);
    });

    it('should show user on location page after setting homeLocationId', async () => {
      // Get location entities
      const response = await request(app)
        .get(`/api/locations/${testLocationForSync.id}/entities`)
        .set('Cookie', `auth_token=${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users).toBeDefined();
      expect(response.body.users.length).toBeGreaterThan(0);
      
      const user = response.body.users.find(u => u.id === testUserId);
      expect(user).toBeDefined();
      expect(user.username).toBe('viewer');
    });

    it('should update LocationLink when changing homeLocationId', async () => {
      // Change homeLocationId to a different location
      await request(app)
        .put('/api/auth/profile')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${viewerCsrfToken}`])
        .set('x-csrf-token', viewerCsrfToken)
        .send({
          homeLocationId: anotherTestLocation.id
        })
        .expect(200);

      // Verify old link is gone or updated
      const oldLink = await LocationLink.findOne({
        where: {
          entity_type: 'user',
          entity_id: testUserId,
          location_id: testLocationForSync.id
        }
      });
      expect(oldLink).toBeNull();

      // Verify new link exists
      const newLink = await LocationLink.findOne({
        where: {
          entity_type: 'user',
          entity_id: testUserId,
          location_id: anotherTestLocation.id
        }
      });

      expect(newLink).not.toBeNull();
      expect(newLink.location_id).toBe(anotherTestLocation.id);
    });

    it('should show user on new location page and not on old location page', async () => {
      // User should appear on new location
      const newLocationResponse = await request(app)
        .get(`/api/locations/${anotherTestLocation.id}/entities`)
        .set('Cookie', `auth_token=${viewerToken}`)
        .expect(200);

      expect(newLocationResponse.body.success).toBe(true);
      const userOnNewLocation = newLocationResponse.body.users.find(u => u.id === testUserId);
      expect(userOnNewLocation).toBeDefined();

      // User should NOT appear on old location
      const oldLocationResponse = await request(app)
        .get(`/api/locations/${testLocationForSync.id}/entities`)
        .set('Cookie', `auth_token=${viewerToken}`)
        .expect(200);

      expect(oldLocationResponse.body.success).toBe(true);
      const userOnOldLocation = oldLocationResponse.body.users.find(u => u.id === testUserId);
      expect(userOnOldLocation).toBeUndefined();
    });

    it('should remove LocationLink when clearing homeLocationId', async () => {
      // Clear homeLocationId (set to null)
      await request(app)
        .put('/api/auth/profile')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${viewerCsrfToken}`])
        .set('x-csrf-token', viewerCsrfToken)
        .send({
          homeLocationId: null
        })
        .expect(200);

      // Verify link is removed
      const link = await LocationLink.findOne({
        where: {
          entity_type: 'user',
          entity_id: testUserId
        }
      });

      expect(link).toBeNull();
    });

    it('should not show user on location page after clearing homeLocationId', async () => {
      // User should NOT appear on the location anymore
      const response = await request(app)
        .get(`/api/locations/${anotherTestLocation.id}/entities`)
        .set('Cookie', `auth_token=${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const user = response.body.users.find(u => u.id === testUserId);
      expect(user).toBeUndefined();
    });

    it('should not create duplicate LocationLinks', async () => {
      // Set homeLocationId
      await request(app)
        .put('/api/auth/profile')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${viewerCsrfToken}`])
        .set('x-csrf-token', viewerCsrfToken)
        .send({
          homeLocationId: testLocationForSync.id,
          searchable: true
        })
        .expect(200);

      // Set the same homeLocationId again
      await request(app)
        .put('/api/auth/profile')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${viewerCsrfToken}`])
        .set('x-csrf-token', viewerCsrfToken)
        .send({
          homeLocationId: testLocationForSync.id,
          searchable: true
        })
        .expect(200);

      // Verify only one link exists
      const links = await LocationLink.findAll({
        where: {
          entity_type: 'user',
          entity_id: testUserId
        }
      });

      expect(links.length).toBe(1);
      expect(links[0].location_id).toBe(testLocationForSync.id);
    });

    it('should update manually created LocationLink when setting homeLocationId', async () => {
      // First, clear any existing homeLocationId
      await request(app)
        .put('/api/auth/profile')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${viewerCsrfToken}`])
        .set('x-csrf-token', viewerCsrfToken)
        .send({
          homeLocationId: null
        })
        .expect(200);

      // Manually create a LocationLink via the API (simulating manual linking)
      await request(app)
        .post('/api/locations/link')
        .set('Cookie', `auth_token=${viewerToken}`)
        .send({
          location_id: anotherTestLocation.id,
          entity_type: 'user',
          entity_id: testUserId
        })
        .expect(201);

      // Verify the manual link was created
      const manualLink = await LocationLink.findOne({
        where: {
          entity_type: 'user',
          entity_id: testUserId,
          location_id: anotherTestLocation.id
        }
      });
      expect(manualLink).not.toBeNull();

      // Now set homeLocationId to a different location
      await request(app)
        .put('/api/auth/profile')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${viewerCsrfToken}`])
        .set('x-csrf-token', viewerCsrfToken)
        .send({
          homeLocationId: testLocationForSync.id,
          searchable: true
        })
        .expect(200);

      // Verify the link was updated (not duplicated)
      const updatedLink = await LocationLink.findOne({
        where: {
          entity_type: 'user',
          entity_id: testUserId
        }
      });

      expect(updatedLink).not.toBeNull();
      expect(updatedLink.location_id).toBe(testLocationForSync.id);

      // Verify only one link exists
      const allLinks = await LocationLink.findAll({
        where: {
          entity_type: 'user',
          entity_id: testUserId
        }
      });
      expect(allLinks.length).toBe(1);
    });

    it('should not delete manual LocationLink when clearing null homeLocationId', async () => {
      // First, ensure homeLocationId is null using the API
      await request(app)
        .put('/api/auth/profile')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${viewerCsrfToken}`])
        .set('x-csrf-token', viewerCsrfToken)
        .send({
          homeLocationId: null
        })
        .expect(200);

      // Delete any existing LocationLinks to start fresh
      await LocationLink.destroy({
        where: {
          entity_type: 'user',
          entity_id: testUserId
        }
      });

      // Manually create a LocationLink via the API (without setting homeLocationId)
      await request(app)
        .post('/api/locations/link')
        .set('Cookie', `auth_token=${viewerToken}`)
        .send({
          location_id: testLocationForSync.id,
          entity_type: 'user',
          entity_id: testUserId
        })
        .expect(201);

      // Verify the manual link exists
      const manualLink = await LocationLink.findOne({
        where: {
          entity_type: 'user',
          entity_id: testUserId
        }
      });
      expect(manualLink).not.toBeNull();

      // Try to clear homeLocationId (which is already null)
      await request(app)
        .put('/api/auth/profile')
        .set('Cookie', [`auth_token=${viewerToken}`, `csrf_token=${viewerCsrfToken}`])
        .set('x-csrf-token', viewerCsrfToken)
        .send({
          homeLocationId: null
        })
        .expect(200);

      // Verify the manual link still exists (wasn't deleted)
      const linkAfterClear = await LocationLink.findOne({
        where: {
          entity_type: 'user',
          entity_id: testUserId
        }
      });
      expect(linkAfterClear).not.toBeNull();
      expect(linkAfterClear.location_id).toBe(testLocationForSync.id);
    });
  });
});
