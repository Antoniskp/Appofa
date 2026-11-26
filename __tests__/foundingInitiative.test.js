const express = require('express');
const request = require('supertest');
const { sequelize, User, FoundingSignature, FoundingSigningDocument } = require('../src/models');
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
  const progress = () => request(app).get(`${base}/progress`);
  const status = `${queue}/${participant.id}`;
  const signUp = { wantsToSign: true, wantsToVolunteer: true, consent: true };

  expect((await request(app).get(queue)).status).toBe(401);
  expect((await request(app).get(queue).set(moderator.headers)).status).toBe(403);
  expect((await request(app).put(interest).set(participant.headers).send({ ...signUp, consent: false })).status).toBe(400);
  expect((await request(app).put(interest).set(participant.headers).send({ ...signUp, signingPreference: 'unknown' })).status).toBe(400);
  expect((await request(app).put(interest).set(participant.headers).send({ ...signUp, signingStatus: 'received', signingPreference: 'remote' })).body.data).toEqual({ wantsToSign: true, wantsToVolunteer: true, signingStatus: 'requested', signingPreference: 'remote' });
  expect((await request(app).get(interest).set(volunteer.headers)).body.data).toBeNull();
  expect((await request(app).put(interest).set(volunteer.headers).send({ ...signUp, wantsToSign: false })).body.data.signingStatus).toBeNull();
  const counts = await progress();
  expect(counts.body.data).toEqual({ signingInterestCount: 1, verifiedCount: 0, goal: 200, document: null });
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
  expect((await progress()).body.data.signingInterestCount).toBe(0);
  const renewed = await request(app).put(interest).set(participant.headers).send(signUp);
  expect(renewed.body.data).toMatchObject({ signingStatus: 'requested', signingPreference: null });
  expect((await request(app).delete(interest).set(participant.headers)).status).toBe(200);
  expect((await progress()).body.data.signingInterestCount).toBe(0);
  expect((await request(app).get(queue).query({ status: 'requested' }).set(admin.headers)).body.data).toEqual([]);
  expect((await request(app).patch(status).set(admin.headers).send({ signingStatus: 'received' })).status).toBe(404);
});

test('counts only verified signatures and publishes an eligible name only with separate, revocable consent', async () => {
  const signer = await login('verified_signer', 'viewer');
  const nextSigner = await login('after_the_first_200', 'viewer');
  const admin = await login('signature_admin', 'admin');
  const base = '/api/founding-initiative';
  const progress = () => request(app).get(`${base}/progress?recognition=true`);
  const lock = headers => request(app).post(`${base}/organizers/document`).set(headers).send({
    version: '1.0', pdfUrl: 'https://example.test/founding-v1.pdf', sha256: 'a'.repeat(64), confirmFinal: true,
  });
  const interest = { wantsToSign: true, wantsToVolunteer: false, contactPhone: '+30 210 123 4567', consent: true };
  const register = (account, payload = interest) => request(app).put(`${base}/interest`).set(account.headers).send(payload);
  const status = (account, signingStatus) => request(app).patch(`${base}/organizers/${account.id}`).set(admin.headers).send({ signingStatus });
  const verify = (account, recordReference, headers = admin.headers) => request(app).post(`${base}/organizers/${account.id}/verify`)
    .set(headers).send({ legalName: 'Confidential legal name', recordReference, confirmSignature: true });
  const publish = (account, consent) => request(app).put(`${base}/recognition`).set(account.headers).send({ publicName: 'Public display name', consent });

  expect((await progress()).body.data).toEqual({ goal: 200, signingInterestCount: 0, verifiedCount: 0, document: null, names: [] });
  expect((await register(signer, { ...interest, contactPhone: 'not a phone' })).status).toBe(400);
  expect((await register(signer)).body.data.contactPhone).toBe(interest.contactPhone);
  expect((await status(signer, 'received')).status).toBe(200);
  expect((await verify(signer, 'F-001')).status).toBe(409);
  expect((await lock(signer.headers)).status).toBe(403);
  expect((await lock(admin.headers)).status).toBe(201);
  expect((await lock(admin.headers)).status).toBe(409);
  expect((await publish(signer, true)).status).toBe(403);
  expect((await verify(signer, 'F-001', signer.headers)).status).toBe(403);
  expect((await verify(signer, 'F-001')).status).toBe(201);
  expect((await status(signer, 'received')).status).toBe(404);
  expect((await verify(signer, 'F-002')).status).toBe(409);

  const privateProgress = await progress();
  expect(privateProgress.headers['cache-control']).toBe('private, no-store');
  expect(privateProgress.headers['x-robots-tag']).toBe('noindex');
  expect(privateProgress.body.data).toEqual({
    goal: 200, signingInterestCount: 1, verifiedCount: 1, names: [],
    document: { version: '1.0', pdfUrl: 'https://example.test/founding-v1.pdf', sha256: 'a'.repeat(64) },
  });
  expect((await publish(signer, false)).status).toBe(400);
  expect((await publish(signer, true)).status).toBe(200);
  expect((await progress()).body.data.names).toEqual(['Public display name']);
  expect((await request(app).delete(`${base}/interest`).set(signer.headers)).status).toBe(200);
  expect((await request(app).delete(`${base}/recognition`).set(signer.headers)).status).toBe(200);
  expect((await progress()).body.data).toMatchObject({ verifiedCount: 1, names: [] });

  await FoundingSignature.bulkCreate(Array.from({ length: 199 }, (_, i) => ({
    recordReference: `ARCHIVE-${i}`, legalName: 'Existing signer',
  })));
  expect((await register(nextSigner)).status).toBe(200);
  expect((await status(nextSigner, 'received')).status).toBe(200);
  expect((await verify(nextSigner, 'f-001')).status).toBe(409);
  expect((await verify(nextSigner, 'F-201')).status).toBe(201);
  expect((await publish(nextSigner, true)).status).toBe(403);
  expect((await progress()).body.data.verifiedCount).toBe(201);
  const verified = await request(app).get(`${base}/organizers?status=verified`).set(admin.headers);
  const firstId = verified.body.data[0].id;
  expect(verified.body.data[0]).toMatchObject({ legalName: 'Confidential legal name', recordReference: 'F-001' });
  expect((await request(app).delete(`${base}/organizers/signatures/${firstId}`).set(admin.headers)).status).toBe(200);
  expect((await publish(nextSigner, true)).status).toBe(200);
  expect((await progress()).body.data).toMatchObject({ verifiedCount: 200, names: ['Public display name'] });
});

test('accepts a private gov.gr receipt only for the enabled final version and deduplicates it after verification', async () => {
  const signer = await login('digital_signer', 'viewer');
  const other = await login('second_digital_signer', 'viewer');
  const admin = await login('digital_admin', 'admin');
  const base = '/api/founding-initiative';
  const [document] = await FoundingSigningDocument.findOrCreate({
    where: { id: 1 },
    defaults: { version: '1.0', pdfUrl: 'https://example.test/founding-v1.pdf', sha256: 'a'.repeat(64) },
  });
  const code = 'DemoReceiptCode_abCD-zz';
  const submit = (account, fields = {}) => request(app).post(`${base}/digital-signature`).set(account.headers)
    .send({ code, consent: true, documentSha256: document.sha256, ...fields });
  const enable = (account, enabled) => request(app).patch(`${base}/organizers/document/gov-gr`).set(account.headers).send({ enabled });
  const progress = () => request(app).get(`${base}/progress?recognition=true`);
  const initialCount = (await progress()).body.data.verifiedCount;

  expect((await submit(signer)).status).toBe(409);
  expect((await enable(signer, true)).status).toBe(403);
  expect((await enable(admin, true)).status).toBe(200);
  expect((await submit(signer, { documentSha256: 'b'.repeat(64) })).status).toBe(409);
  expect((await submit(signer, { consent: false })).status).toBe(400);
  expect((await submit(signer)).body.data).toEqual({ received: true, verified: false });
  expect((await submit(signer)).status).toBe(201);
  expect((await submit(other)).status).toBe(409);
  expect((await request(app).get(`${base}/digital-signature`).set(signer.headers)).body.data).toEqual({ received: true, verified: false });
  expect((await request(app).get(`${base}/interest`).set(signer.headers)).body.data).not.toHaveProperty('govVerificationCode');
  const pending = await request(app).get(`${base}/organizers?status=received`).set(admin.headers);
  expect(pending.body.data.find(row => row.userId === signer.id).govVerificationCode).toBe(code);
  const before = await progress();
  expect(before.body.data.verifiedCount).toBe(initialCount);
  expect(before.text).not.toContain(code);

  const verify = govVerificationCode => request(app).post(`${base}/organizers/${signer.id}/verify`).set(admin.headers)
    .send({ legalName: 'Example legal name', recordReference: 'DIG-001', confirmSignature: true, govVerificationCode });
  expect((await verify('outdated')).status).toBe(409);
  expect((await verify(code)).status).toBe(201);
  expect((await request(app).get(`${base}/digital-signature`).set(signer.headers)).body.data).toEqual({ received: false, verified: true });
  expect((await submit(other)).status).toBe(409);
  expect((await submit(signer, { code: 'DemoReceiptCode_UNIQUE' })).status).toBe(409);
  expect((await progress()).body.data).toMatchObject({ verifiedCount: initialCount + 1, govGrEnabled: true });
  expect((await enable(admin, false)).status).toBe(200);
  expect((await progress()).body.data).not.toHaveProperty('govGrEnabled');
});
