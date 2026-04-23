const request = require('supertest');
const app = require('../src/index');
const { sequelize, User, Location, OrganizationMember } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');

describe('Organizations API', () => {
  let adminUser;
  let adminToken;
  let viewerUser;
  let viewerToken;
  let testLocation;

  const withCsrf = (userId, authToken, csrfToken) => {
    storeCsrfToken(csrfToken, userId);
    return {
      Cookie: [`auth_token=${authToken}`, `csrf_token=${csrfToken}`],
      'x-csrf-token': csrfToken,
    };
  };

  const registerAndLogin = async (username, role = 'viewer') => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username,
        email: `${username}@test.com`,
        password: 'Test1234!',
      });

    const user = await User.findOne({ where: { username } });
    if (role !== 'viewer') {
      await user.update({ role });
    }

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: `${username}@test.com`, password: 'Test1234!' });

    const authCookie = loginRes.headers['set-cookie']
      .find((cookie) => cookie.startsWith('auth_token='));

    return {
      user: await User.findByPk(user.id),
      token: authCookie.split(';')[0].replace('auth_token=', ''),
    };
  };

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    ({ user: adminUser, token: adminToken } = await registerAndLogin('organizations_admin', 'admin'));
    ({ user: viewerUser, token: viewerToken } = await registerAndLogin('organizations_viewer', 'viewer'));

    testLocation = await Location.create({
      name: 'Organizations Test Location',
      slug: 'organizations-test-location',
      type: 'municipality',
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('creates organizations with unique slugs and owner membership', async () => {
    const createOne = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-1'))
      .send({
        name: 'Open Civic Lab',
        type: 'organization',
        description: 'First organization',
        locationId: testLocation.id,
      });

    expect(createOne.status).toBe(201);
    expect(createOne.body.success).toBe(true);
    expect(createOne.body.data.organization.slug).toBe('open-civic-lab');

    const members = await OrganizationMember.findAll({
      where: { organizationId: createOne.body.data.organization.id },
    });
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe(adminUser.id);
    expect(members[0].role).toBe('owner');

    const createTwo = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-2'))
      .send({
        name: 'Open Civic Lab',
        type: 'organization',
      });

    expect(createTwo.status).toBe(201);
    expect(createTwo.body.data.organization.slug).toBe('open-civic-lab-2');
  });

  it('lists and fetches organizations by slug', async () => {
    const listRes = await request(app)
      .get('/api/organizations')
      .query({ search: 'Civic', type: 'organization' });

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data.organizations)).toBe(true);
    expect(listRes.body.data.organizations.length).toBeGreaterThan(0);

    const first = listRes.body.data.organizations[0];
    const singleRes = await request(app).get(`/api/organizations/${first.slug}`);

    expect(singleRes.status).toBe(200);
    expect(singleRes.body.success).toBe(true);
    expect(singleRes.body.data.organization.createdBy).toBeDefined();
  });

  it('enforces private members endpoint visibility', async () => {
    const privateCreate = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-private'))
      .send({
        name: 'Private Member Club',
        type: 'organization',
        isPublic: false,
      });

    expect(privateCreate.status).toBe(201);
    const privateOrgId = privateCreate.body.data.organization.id;

    const guestMembers = await request(app).get(`/api/organizations/${privateOrgId}/members`);
    expect(guestMembers.status).toBe(403);
    expect(guestMembers.body.success).toBe(false);

    const viewerMembersDenied = await request(app)
      .get(`/api/organizations/${privateOrgId}/members`)
      .set('Cookie', `auth_token=${viewerToken}`);
    expect(viewerMembersDenied.status).toBe(403);

    await OrganizationMember.create({
      organizationId: privateOrgId,
      userId: viewerUser.id,
      role: 'member',
      status: 'active',
    });

    const viewerMembersAllowed = await request(app)
      .get(`/api/organizations/${privateOrgId}/members`)
      .set('Cookie', `auth_token=${viewerToken}`);
    expect(viewerMembersAllowed.status).toBe(200);
    expect(viewerMembersAllowed.body.success).toBe(true);
    expect(Array.isArray(viewerMembersAllowed.body.data.members)).toBe(true);
  });

  it('allows admin delete', async () => {
    const createRes = await request(app)
      .post('/api/organizations')
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-create-delete'))
      .send({
        name: 'Delete Me Organization',
        type: 'organization',
      });

    const deleteRes = await request(app)
      .delete(`/api/organizations/${createRes.body.data.organization.id}`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-org-delete'));

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});
