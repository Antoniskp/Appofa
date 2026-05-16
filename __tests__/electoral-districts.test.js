const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/index');
const { sequelize, User, Location, MunicipalityDistrictMap } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');

describe('Electoral Districts API', () => {
  let country;
  let prefecture;
  let municipality;
  let municipality2;
  let district1;
  let district2;
  let adminUser;
  let adminToken;
  let regularUser;
  let regularToken;

  const csrfHeaders = (token, userId) => {
    const csrfToken = `test-electoral-district-csrf-${userId}`;
    storeCsrfToken(csrfToken, userId);
    return {
      Authorization: `Bearer ${token}`,
      Cookie: [`csrf_token=${csrfToken}`],
      'x-csrf-token': csrfToken,
    };
  };

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    country = await Location.create({
      name: 'Test Country',
      type: 'country',
      slug: 'electoral-test-country',
      code: 'TC',
    });

    prefecture = await Location.create({
      name: 'Test Prefecture',
      type: 'prefecture',
      slug: 'electoral-test-prefecture',
      parent_id: country.id,
    });

    municipality = await Location.create({
      name: 'Test Municipality',
      type: 'municipality',
      slug: 'electoral-test-municipality',
      parent_id: prefecture.id,
    });

    municipality2 = await Location.create({
      name: 'Test Municipality 2',
      type: 'municipality',
      slug: 'electoral-test-municipality-2',
      parent_id: prefecture.id,
    });

    district1 = await Location.create({
      name: 'Alpha Electoral District',
      type: 'electoral_district',
      slug: 'electoral-test-district-alpha',
      parent_id: prefecture.id,
    });

    district2 = await Location.create({
      name: 'Beta Electoral District',
      type: 'electoral_district',
      slug: 'electoral-test-district-beta',
      parent_id: prefecture.id,
    });

    adminUser = await User.create({
      username: 'electoraladmin',
      email: 'electoral.admin@test.com',
      password: 'password123',
      role: 'admin',
    });

    regularUser = await User.create({
      username: 'electoralviewer',
      email: 'electoral.viewer@test.com',
      password: 'password123',
      role: 'viewer',
    });

    adminToken = jwt.sign(
      { id: adminUser.id, role: adminUser.role, email: adminUser.email, username: adminUser.username },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    regularToken = jwt.sign(
      { id: regularUser.id, role: regularUser.role, email: regularUser.email, username: regularUser.username },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ---------------------------------------------------------------------------
  // Location model: electoral_district type
  // ---------------------------------------------------------------------------

  describe('Location model — electoral_district type', () => {
    it('creates an electoral_district location successfully', () => {
      expect(district1.type).toBe('electoral_district');
      expect(district1.parent_id).toBe(prefecture.id);
    });

    it('accepts electoral_district in GET /api/locations with type filter', async () => {
      const res = await request(app)
        .get('/api/locations')
        .query({ type: 'electoral_district' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.locations.find((l) => l.id === district1.id);
      expect(found).toBeTruthy();
      expect(found.type).toBe('electoral_district');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/locations — create electoral_district
  // ---------------------------------------------------------------------------

  describe('POST /api/locations — create electoral_district', () => {
    it('allows admin to create an electoral_district', async () => {
      const res = await request(app)
        .post('/api/locations')
        .set(csrfHeaders(adminToken, adminUser.id))
        .send({
          name: 'Gamma Electoral District',
          type: 'electoral_district',
          parent_id: prefecture.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.location.type).toBe('electoral_district');
    });

    it('rejects unauthenticated creation', async () => {
      const res = await request(app)
        .post('/api/locations')
        .send({ name: 'Unauthorised District', type: 'electoral_district', parent_id: prefecture.id });
      expect([401, 403]).toContain(res.status);
    });
  });

  // ---------------------------------------------------------------------------
  // Mapping: GET /api/locations/:id/electoral-districts
  // ---------------------------------------------------------------------------

  describe('GET /api/locations/:id/electoral-districts', () => {
    beforeAll(async () => {
      await MunicipalityDistrictMap.create({
        municipalityId: municipality.id,
        electoralDistrictId: district1.id,
      });
    });

    it('returns districts for a municipality', async () => {
      const res = await request(app)
        .get(`/api/locations/${municipality.id}/electoral-districts`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.districts)).toBe(true);
      expect(res.body.districts.some((d) => d.id === district1.id)).toBe(true);
    });

    it('returns empty array for a location with no mappings', async () => {
      const res = await request(app)
        .get(`/api/locations/${municipality2.id}/electoral-districts`);

      expect(res.status).toBe(200);
      expect(res.body.districts).toEqual([]);
    });

    it('returns 404 for a non-existent location', async () => {
      const res = await request(app)
        .get('/api/locations/999999/electoral-districts');
      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // Mapping: GET /api/locations/:id/municipalities
  // ---------------------------------------------------------------------------

  describe('GET /api/locations/:id/municipalities', () => {
    it('returns municipalities for an electoral district', async () => {
      const res = await request(app)
        .get(`/api/locations/${district1.id}/municipalities`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.municipalities)).toBe(true);
      expect(res.body.municipalities.some((m) => m.id === municipality.id)).toBe(true);
    });

    it('returns 400 when the location is not an electoral district', async () => {
      const res = await request(app)
        .get(`/api/locations/${prefecture.id}/municipalities`);
      expect(res.status).toBe(400);
    });

    it('returns 404 for a non-existent district', async () => {
      const res = await request(app)
        .get('/api/locations/999998/municipalities');
      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // Mapping: POST /api/locations/:id/electoral-districts
  // ---------------------------------------------------------------------------

  describe('POST /api/locations/:id/electoral-districts', () => {
    it('allows admin to add a mapping', async () => {
      const res = await request(app)
        .post(`/api/locations/${municipality2.id}/electoral-districts`)
        .set(csrfHeaders(adminToken, adminUser.id))
        .send({ electoralDistrictId: district2.id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.mapping.municipalityId).toBe(municipality2.id);
      expect(res.body.mapping.electoralDistrictId).toBe(district2.id);
    });

    it('returns 409 on duplicate mapping', async () => {
      // district1 <-> municipality already exists from beforeAll above
      const res = await request(app)
        .post(`/api/locations/${municipality.id}/electoral-districts`)
        .set(csrfHeaders(adminToken, adminUser.id))
        .send({ electoralDistrictId: district1.id });

      expect(res.status).toBe(409);
    });

    it('returns 400 when target is not an electoral_district', async () => {
      const res = await request(app)
        .post(`/api/locations/${municipality.id}/electoral-districts`)
        .set(csrfHeaders(adminToken, adminUser.id))
        .send({ electoralDistrictId: prefecture.id });

      expect(res.status).toBe(400);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app)
        .post(`/api/locations/${municipality2.id}/electoral-districts`)
        .send({ electoralDistrictId: district1.id });

      expect([401, 403]).toContain(res.status);
    });

    it('rejects non-admin request', async () => {
      const res = await request(app)
        .post(`/api/locations/${municipality2.id}/electoral-districts`)
        .set({ Authorization: `Bearer ${regularToken}` })
        .send({ electoralDistrictId: district1.id });

      expect([401, 403]).toContain(res.status);
    });

    it('supports many-to-many: municipality mapped to two districts', async () => {
      // municipality is already mapped to district1; now map it to district2
      const res = await request(app)
        .post(`/api/locations/${municipality.id}/electoral-districts`)
        .set(csrfHeaders(adminToken, adminUser.id))
        .send({ electoralDistrictId: district2.id });

      expect(res.status).toBe(201);

      // Verify both mappings exist
      const listRes = await request(app)
        .get(`/api/locations/${municipality.id}/electoral-districts`);
      expect(listRes.body.districts.length).toBeGreaterThanOrEqual(2);
      const districtIds = listRes.body.districts.map((d) => d.id);
      expect(districtIds).toContain(district1.id);
      expect(districtIds).toContain(district2.id);
    });
  });

  // ---------------------------------------------------------------------------
  // Mapping: DELETE /api/locations/:id/electoral-districts/:mappingId
  // ---------------------------------------------------------------------------

  describe('DELETE /api/locations/:id/electoral-districts/:mappingId', () => {
    let testMappingId;

    beforeAll(async () => {
      // Create a fresh mapping to remove in tests
      const m = await MunicipalityDistrictMap.create({
        municipalityId: municipality2.id,
        electoralDistrictId: district1.id,
      });
      testMappingId = m.id;
    });

    it('allows admin to remove a mapping', async () => {
      const res = await request(app)
        .delete(`/api/locations/${municipality2.id}/electoral-districts/${testMappingId}`)
        .set(csrfHeaders(adminToken, adminUser.id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it's gone
      const gone = await MunicipalityDistrictMap.findByPk(testMappingId);
      expect(gone).toBeNull();
    });

    it('returns 404 for a non-existent mapping', async () => {
      const res = await request(app)
        .delete(`/api/locations/${municipality2.id}/electoral-districts/999997`)
        .set(csrfHeaders(adminToken, adminUser.id));

      expect(res.status).toBe(404);
    });

    it('rejects unauthenticated removal', async () => {
      const res = await request(app)
        .delete(`/api/locations/${municipality2.id}/electoral-districts/${testMappingId}`);
      expect([401, 403]).toContain(res.status);
    });
  });
});
