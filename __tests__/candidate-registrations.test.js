const request = require('supertest');
const app = require('../src/index');
const { sequelize, User, Location, CandidateRegistration } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');

describe('Candidate registrations API', () => {
  let adminUser;
  let adminToken;
  let viewerUser;
  let viewerToken;
  let testLocation;
  let outsideLocation;

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

    ({ user: adminUser, token: adminToken } = await registerAndLogin('candidate_admin', 'admin'));
    ({ user: viewerUser, token: viewerToken } = await registerAndLogin('candidate_viewer'));

    const country = await Location.create({
      name: 'Candidate Test Country',
      name_local: 'Candidate Country Local',
      slug: 'candidate-test-country',
      type: 'country',
    });
    const prefecture = await Location.create({
      name: 'Candidate Test Prefecture',
      name_local: 'Candidate Prefecture Local',
      slug: 'candidate-test-prefecture',
      type: 'prefecture',
      parent_id: country.id,
    });
    testLocation = await Location.create({
      name: 'Candidate Test Location',
      name_local: 'Candidate Local',
      slug: 'candidate-test-location',
      type: 'municipality',
      parent_id: prefecture.id,
    });
    outsideLocation = await Location.create({
      name: 'Candidate Outside Location',
      name_local: 'Candidate Outside Local',
      slug: 'candidate-outside-location',
      type: 'municipality',
    });

    await viewerUser.update({ homeLocationId: testLocation.id });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('records a founding application for the selected district and keeps it private after review', async () => {
    const { user, token } = await registerAndLogin('founding_applicant');
    await user.update({ homeLocationId: testLocation.id, profileVisibility: 'hidden' });
    const district = await Location.create({
      name: 'Arta',
      name_local: 'Άρτας',
      slug: 'arta-1',
      type: 'electoral_district',
    });
    const payload = {
      source: 'founding_initiative',
      districtSlug: 'gr-electoral-arta',
      consultationCommitment: 'I will consult constituents before major votes.',
      acceptCommitment: true,
      contactEmail: 'founding_applicant@test.com',
    };
    const submit = (data) => request(app).post('/api/candidate-registrations')
      .set(withCsrf(user.id, token, 'csrf-founding-apply')).send(data);

    expect((await submit({ ...payload, acceptCommitment: false })).status).toBe(400);
    expect((await submit({ ...payload, consultationCommitment: ' ' })).status).toBe(400);
    expect((await submit({ ...payload, districtSlug: 'candidate-test-prefecture' })).status).toBe(400);
    const submitted = await submit(payload);
    expect(submitted.status).toBe(201);
    const registration = submitted.body.data.registration;
    expect(registration).toMatchObject({
      source: payload.source,
      positionType: 'parliamentary',
      status: 'submitted',
      locationId: district.id,
      consultationCommitment: payload.consultationCommitment,
    });
    expect((await submit(payload)).status).toBe(409);
    const reloaded = await user.reload();
    expect(reloaded).toMatchObject({ role: 'viewer', homeLocationId: testLocation.id, profileVisibility: 'hidden' });

    const path = `/api/candidate-registrations/${registration.id}`;
    const queue = await request(app).get('/api/candidate-registrations')
      .set('Cookie', `auth_token=${adminToken}`).query({ source: payload.source, status: 'submitted' });
    expect(queue.body.data.registrations.map(({ id }) => id)).toContain(registration.id);
    const approved = await request(app).put(path)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-founding-review')).send({ status: 'approved' });
    expect(approved.status).toBe(200);
    expect((await request(app).get(path)).status).toBe(404);
    const owned = await request(app).get(path).set('Cookie', `auth_token=${token}`);
    expect(owned.status).toBe(200);
    expect(owned.headers['cache-control']).toBe('private, no-store');

    // Even an applicant who later publishes their profile stays off candidate lists.
    await user.update({ profileVisibility: 'public' });
    const publicList = await request(app).get('/api/candidate-registrations')
      .query({ source: payload.source, locationId: district.id });
    expect(publicList.body.data.registrations).toHaveLength(0);
    const publicMap = await request(app).get('/api/electoral-districts/candidates');
    expect(publicMap.body.data.registrations.map(({ id }) => id)).not.toContain(registration.id);

    const archived = await request(app).delete(path).set(withCsrf(user.id, token, 'csrf-founding-withdraw'));
    expect(archived.status).toBe(200);
    const resubmitted = await submit(payload);
    expect(resubmitted.status).toBe(201);
    expect(resubmitted.body.data.registration).toMatchObject({ id: registration.id, status: 'submitted', reviewedAt: null });
  });

  it('rejects registrations outside the user location hierarchy', async () => {
    const createRes = await request(app)
      .post('/api/candidate-registrations')
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-candidate-outside-location'))
      .send({
        locationId: outsideLocation.id,
        positionType: 'mayor',
        electionCycle: 'current',
      });

    expect(createRes.status).toBe(403);
    expect(createRes.body.message).toMatch(/own location hierarchy/i);
  });

  it('rejects positions that do not match the selected location type', async () => {
    const createRes = await request(app)
      .post('/api/candidate-registrations')
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-candidate-bad-position'))
      .send({
        locationId: testLocation.id,
        positionType: 'county_council',
        electionCycle: 'current',
      });

    expect(createRes.status).toBe(400);
    expect(createRes.body.message).toMatch(/not available/i);
  });

  it('creates a submitted registration, promotes the user, and hides it from public lists until approved', async () => {
    const createRes = await request(app)
      .post('/api/candidate-registrations')
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-candidate-create'))
      .send({
        locationId: testLocation.id,
        positionType: 'mayor',
        electionCycle: 'current',
        partyName: 'Old Party',
        isIndependent: true,
        slogan: 'Local work first',
        consultationCommitment: ' I will consult residents monthly and publish my responses. ',
        websiteUrl: 'https://example.com/campaign',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.registration.status).toBe('submitted');
    expect(createRes.body.data.registration.partyName).toBeNull();
    expect(createRes.body.data.registration.consultationCommitment).toBe('I will consult residents monthly and publish my responses.');

    const promoted = await User.findByPk(viewerUser.id);
    expect(promoted.role).toBe('candidate');
    expect(promoted.homeLocationId).toBe(testLocation.id);
    expect(promoted.profileVisibility).toBe('public');

    const publicList = await request(app)
      .get('/api/candidate-registrations')
      .query({ locationId: testLocation.id });

    expect(publicList.status).toBe(200);
    expect(publicList.body.data.registrations).toHaveLength(0);
  });

  it('lets staff approve with review notes and exposes approved registrations publicly', async () => {
    const registration = await CandidateRegistration.findOne({ where: { userId: viewerUser.id } });

    const approveRes = await request(app)
      .put(`/api/candidate-registrations/${registration.id}`)
      .set(withCsrf(adminUser.id, adminToken, 'csrf-candidate-approve'))
      .send({
        status: 'approved',
        reviewNotes: 'Verified candidate details.',
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.registration.status).toBe('approved');
    expect(approveRes.body.data.registration.reviewNotes).toBe('Verified candidate details.');

    const publicList = await request(app)
      .get('/api/candidate-registrations')
      .query({ locationId: testLocation.id });

    expect(publicList.status).toBe(200);
    expect(publicList.body.data.registrations).toHaveLength(1);
    expect(publicList.body.data.registrations[0].id).toBe(registration.id);
  });

  it('sends a changed consultation plan back to review before it can appear publicly', async () => {
    const registration = await CandidateRegistration.findOne({ where: { userId: viewerUser.id } });
    const response = await request(app).put(`/api/candidate-registrations/${registration.id}`)
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-consultation-edit'))
      .send({ consultationCommitment: '  Consult residents before each council meeting.  ' });
    expect(response.status).toBe(200);
    expect(response.body.data.registration.consultationCommitment).toBe('Consult residents before each council meeting.');
    expect(response.body.data.registration.status).toBe('submitted');
    expect(response.body.data.registration.reviewedAt).toBeNull();
    const publicList = await request(app).get('/api/candidate-registrations').query({ locationId: testLocation.id });
    expect(publicList.body.data.registrations).toHaveLength(0);
  });

  it('reuses an archived registration without carrying stale review data', async () => {
    const registration = await CandidateRegistration.findOne({ where: { userId: viewerUser.id } });

    const archiveRes = await request(app)
      .delete(`/api/candidate-registrations/${registration.id}`)
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-candidate-archive'));

    expect(archiveRes.status).toBe(200);

    const recreateRes = await request(app)
      .post('/api/candidate-registrations')
      .set(withCsrf(viewerUser.id, viewerToken, 'csrf-candidate-recreate'))
      .send({
        locationId: testLocation.id,
        positionType: 'mayor',
        electionCycle: 'current',
        partyName: 'New Party',
        isIndependent: false,
      });

    expect(recreateRes.status).toBe(201);
    expect(recreateRes.body.data.registration.id).toBe(registration.id);
    expect(recreateRes.body.data.registration.status).toBe('submitted');
    expect(recreateRes.body.data.registration.partyName).toBe('New Party');
    expect(recreateRes.body.data.registration.reviewNotes).toBeNull();
    expect(recreateRes.body.data.registration.reviewedByUserId).toBeNull();
    expect(recreateRes.body.data.registration.reviewedAt).toBeNull();
  });
});
