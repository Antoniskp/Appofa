const express = require('express');
const request = require('supertest');
const { sequelize, User } = require('../src/models');
const { storeCsrfToken } = require('../src/utils/csrf');

const app = express();
app.use(express.json());
app.use('/api/auth', require('../src/routes/authRoutes'));
app.use('/api/founding-initiative', require('../src/routes/foundingInitiativeRoutes'));

async function login(username, role) {
  const email = `${username}@example.test`;
  const password = 'LocalTestPassword123!';
  const user = await User.create({ username, email, password, role });
  const response = await request(app).post('/api/auth/login').send({ email, password });
  expect(response.status).toBe(200);
  const auth = response.headers['set-cookie'].find(cookie => cookie.startsWith('auth_token=')).split(';')[0];
  const csrf = `csrf-founding-${user.id}`;
  storeCsrfToken(csrf, user.id);
  return { id: user.id, headers: { Cookie: [auth, `csrf_token=${csrf}`], 'x-csrf-token': csrf } };
}

beforeAll(async () => { await sequelize.sync({ force: true }); });
afterAll(async () => { await sequelize.close(); });

test('collects explicit opt-in and lets admins organize signatures while participants can withdraw', async () => {
  const participant = await login('first_signer', 'viewer');
  const volunteer = await login('volunteer', 'viewer');
  const moderator = await login('staff', 'moderator');
  const admin = await login('organizer', 'admin');
  const base = '/api/founding-initiative';
  const interest = `${base}/interest`;
  const queue = `${base}/organizers`;
  const status = `${queue}/${participant.id}`;
  const signUp = { wantsToSign: true, wantsToVolunteer: true, consent: true };

  expect((await request(app).get(queue)).status).toBe(401);
  expect((await request(app).get(queue).set(moderator.headers)).status).toBe(403);
  expect((await request(app).put(interest).set(participant.headers).send({ ...signUp, consent: false })).status).toBe(400);
  expect((await request(app).put(interest).set(participant.headers).send({ ...signUp, signingPreference: 'unknown' })).status).toBe(400);
  expect((await request(app).put(interest).set(participant.headers).send({ ...signUp, signingStatus: 'received', signingPreference: 'remote' })).body.data).toEqual({ wantsToSign: true, wantsToVolunteer: true, signingStatus: 'requested', signingPreference: 'remote' });
  expect((await request(app).get(interest).set(volunteer.headers)).body.data).toBeNull();
  expect((await request(app).put(interest).set(volunteer.headers).send({ ...signUp, wantsToSign: false })).body.data.signingStatus).toBeNull();
  expect((await request(app).patch(status).set(participant.headers).send({ signingStatus: 'received' })).status).toBe(403);

  const pending = await request(app).get(queue).query({ status: 'requested' }).set(admin.headers);
  expect(pending.headers['cache-control']).toBe('private, no-store');
  expect(pending.body.data).toEqual([{
    userId: participant.id,
    participant: { username: 'first_signer', email: 'first_signer@example.test' },
    wantsToSign: true, wantsToVolunteer: true, signingStatus: 'requested', signingPreference: 'remote',
  }]);
  expect((await request(app).get(queue).query({ status: 'volunteer' }).set(admin.headers)).body.pagination.total).toBe(2);
  expect((await request(app).patch(status).set(admin.headers).send({ signingStatus: 'received' })).status).toBe(200);
  const updated = await request(app).put(interest).set(participant.headers).send({ ...signUp, wantsToVolunteer: false });
  expect(updated.body.data).toEqual({ wantsToSign: true, wantsToVolunteer: false, signingStatus: 'received', signingPreference: 'remote' });
  expect((await request(app).get(interest).set(participant.headers)).body.data.signingStatus).toBe('received');
  expect((await request(app).put(interest).set(participant.headers).send({ ...signUp, wantsToSign: false })).body.data.signingStatus).toBeNull();
  const renewed = await request(app).put(interest).set(participant.headers).send(signUp);
  expect(renewed.body.data).toMatchObject({ signingStatus: 'requested', signingPreference: null });
  expect((await request(app).delete(interest).set(participant.headers)).status).toBe(200);
  expect((await request(app).get(queue).query({ status: 'requested' }).set(admin.headers)).body.data).toEqual([]);
  expect((await request(app).patch(status).set(admin.headers).send({ signingStatus: 'received' })).status).toBe(404);
});
