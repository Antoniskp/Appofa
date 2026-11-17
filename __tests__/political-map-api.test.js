const express = require('express');
const request = require('supertest');
const { sequelize, User, Location, CandidateRegistration } = require('../src/models');
const app = express();
app.use('/electoral', require('../src/routes/electoralMapRoutes'));
let candidate, broad, district;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  candidate = await User.create({ username: 'public-candidate', email: 'candidate@example.test', password: 'Password123!', profileVisibility: 'public' });
  const hidden = await User.create({ username: 'hidden-candidate', email: 'hidden@example.test', password: 'Password123!', profileVisibility: 'hidden' });
  broad = await Location.create({ name: 'Broad area', slug: 'broad-area', type: 'prefecture' });
  district = await Location.create({ name: 'Athens A', slug: 'gr-electoral-athens-a', type: 'electoral_district', parent_id: broad.id });
  await Location.create({ name: 'Athens North', slug: 'gr-electoral-athens-b1-north-athens', type: 'electoral_district', parent_id: broad.id });
  await CandidateRegistration.bulkCreate([
    { userId: candidate.id, locationId: district.id, electionCycle: '2027', status: 'approved', contactEmail: 'private@example.test', reviewNotes: 'staff only', consultationCommitment: 'Consult residents monthly.' },
    { userId: candidate.id, locationId: broad.id, electionCycle: '2027', status: 'approved' },
    { userId: candidate.id, locationId: district.id, electionCycle: '2028', status: 'submitted' },
    { userId: hidden.id, locationId: district.id, electionCycle: '2027', status: 'approved' },
  ].map(item => ({ positionType: 'parliamentary', ...item })));
});
afterAll(async () => sequelize.close());

test('public map shows approved discoverable campaigns without exposing private fields', async () => {
  const response = await request(app).get('/electoral/candidates');
  expect(response.status).toBe(200);
  expect(response.body.data.registrations).toHaveLength(2);
  const exact = response.body.data.registrations.find(item => item.locationId === district.id);
  expect(exact.districtId).toBe('district-athens-a');
  expect(exact.consultationCommitment).toBe('Consult residents monthly.');
  expect(exact).not.toHaveProperty('contactEmail');
  expect(exact).not.toHaveProperty('reviewNotes');
  expect(response.body.data.registrations.find(item => item.locationId === broad.id).districtId).toBeNull();
});

test('candidate pagination is stable and rejects invalid query values', async () => {
  const first = await request(app).get('/electoral/candidates?limit=1');
  const second = await request(app).get('/electoral/candidates?limit=1&page=2');
  expect(first.body.data.pagination.totalPages).toBe(2);
  expect(first.body.data.registrations[0].id).not.toBe(second.body.data.registrations[0].id);
  expect((await request(app).get('/electoral/candidates?page=bad')).status).toBe(400);
});
