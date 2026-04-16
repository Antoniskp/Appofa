const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/index');
const { sequelize, User, Location, LocationRole } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');

describe('Location Elections API', () => {
  let municipality;
  let country;
  let residentA;
  let residentB;
  let outsider;
  let residentAToken;
  let outsiderToken;

  const csrfHeaders = (token, userId) => {
    const csrfToken = `test-location-election-csrf-${userId}`;
    storeCsrfToken(csrfToken, userId);
    return {
      Authorization: `Bearer ${token}`,
      Cookie: [`csrf_token=${csrfToken}`],
      'x-csrf-token': csrfToken,
    };
  };

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    municipality = await Location.create({
      name: 'Election Municipality',
      type: 'municipality',
      slug: 'municipality-election-municipality',
    });

    country = await Location.create({
      name: 'Election Country',
      type: 'country',
      slug: 'country-election-country',
      code: 'EL',
    });

    residentA = await User.create({
      username: 'residentA',
      email: 'residentA@test.com',
      password: 'password123',
      homeLocationId: municipality.id,
    });

    residentB = await User.create({
      username: 'residentB',
      email: 'residentB@test.com',
      password: 'password123',
      homeLocationId: municipality.id,
    });

    outsider = await User.create({
      username: 'outsider',
      email: 'outsider@test.com',
      password: 'password123',
      homeLocationId: country.id,
    });

    await LocationRole.create({
      locationId: municipality.id,
      roleKey: 'moderator',
      userId: residentB.id,
      sortOrder: 0,
    });

    residentAToken = jwt.sign(
      { id: residentA.id, role: residentA.role, email: residentA.email, username: residentA.username },
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
    );

    outsiderToken = jwt.sign(
      { id: outsider.id, role: outsider.role, email: outsider.email, username: outsider.username },
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('returns moderator + configured role elections for municipality', async () => {
    const response = await request(app)
      .get(`/api/locations/${municipality.id}/elections`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.locationType).toBe('municipality');
    expect(response.body.elections.map((election) => election.roleKey)).toEqual([
      'moderator',
      'mayor',
      'deputy_mayor',
      'council_president',
    ]);
    expect(response.body.elections[0].currentHolder.username).toBe('residentB');
  });

  it('returns only moderator election for country locations', async () => {
    const response = await request(app)
      .get(`/api/locations/${country.id}/elections`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.locationType).toBe('country');
    expect(response.body.elections.map((election) => election.roleKey)).toEqual(['moderator']);
  });

  it('allows a location member to cast, change and remove vote', async () => {
    await request(app)
      .post(`/api/locations/${municipality.id}/elections/moderator/vote`)
      .set(csrfHeaders(residentAToken, residentA.id))
      .send({ candidateUserId: residentB.id })
      .expect(200);

    await request(app)
      .post(`/api/locations/${municipality.id}/elections/moderator/vote`)
      .set(csrfHeaders(residentAToken, residentA.id))
      .send({ candidateUserId: residentA.id })
      .expect(200);

    const afterUpdate = await request(app)
      .get(`/api/locations/${municipality.id}/elections`)
      .set('Authorization', `Bearer ${residentAToken}`)
      .expect(200);

    const moderatorElection = afterUpdate.body.elections.find((election) => election.roleKey === 'moderator');
    expect(moderatorElection.myVote).toEqual({ candidateUserId: residentA.id });
    expect(moderatorElection.totalVotes).toBe(1);

    await request(app)
      .delete(`/api/locations/${municipality.id}/elections/moderator/vote`)
      .set(csrfHeaders(residentAToken, residentA.id))
      .expect(200);

    const afterDelete = await request(app)
      .get(`/api/locations/${municipality.id}/elections`)
      .set('Authorization', `Bearer ${residentAToken}`)
      .expect(200);

    const moderatorAfterDelete = afterDelete.body.elections.find((election) => election.roleKey === 'moderator');
    expect(moderatorAfterDelete.myVote).toBeNull();
    expect(moderatorAfterDelete.totalVotes).toBe(0);
  });

  it('rejects votes from users outside the location', async () => {
    const response = await request(app)
      .post(`/api/locations/${municipality.id}/elections/moderator/vote`)
      .set(csrfHeaders(outsiderToken, outsider.id))
      .send({ candidateUserId: residentA.id })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Μπορείτε να ψηφίσετε μόνο για την τοποθεσία σας.');
  });
});
