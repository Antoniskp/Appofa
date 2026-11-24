'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { sequelize, User } = require('../src/models');
const legalLibraryRoutes = require('../src/routes/legalLibraryRoutes');
const reportRoutes = require('../src/routes/reportRoutes');
const { requestLibrary } = require('../src/services/legalLibraryService');
const { storeCsrfToken } = require('../src/utils/csrf');

jest.mock('../src/services/legalLibraryService', () => ({ requestLibrary: jest.fn() }));
jest.mock('../src/services/ipAccessService', () => ({}));

const app = express();
app.use(express.json());
app.use('/api/laws', legalLibraryRoutes);
app.use('/api/reports', reportRoutes);

const law = { documentId: 'law:20:2026', unitId: '' };
const paragraph = { ...law, unitId: 'law:20:2026:article:2:paragraph:1' };
const parent = { id: 'law:20:2026:article:2', label: 'Άρθρο 2' };
const targetQuery = ids => '/api/laws/feedback?' + new URLSearchParams(ids);
let greek, secondGreek, other, unverified, moderator;

function auth(user, csrf = true) {
  const token = jwt.sign({ id: user.id, sessionVersion: user.sessionVersion }, process.env.JWT_SECRET);
  const headers = { Cookie: 'auth_token=' + token };
  if (csrf) {
    const csrfToken = 'law-feedback-csrf-' + user.id;
    storeCsrfToken(csrfToken, user.id);
    headers.Cookie += '; csrf_token=' + csrfToken;
    headers['x-csrf-token'] = csrfToken;
  }
  return headers;
}

const putVote = (user, ids, choice, csrf = true) => request(app).put('/api/laws/feedback/vote')
  .set(auth(user, csrf)).send({ ...ids, choice });

beforeAll(async () => {
  await sequelize.sync({ force: true });
  greek = await User.create({ username: 'law_greek', nationality: 'GR', emailVerified: true });
  secondGreek = await User.create({ username: 'law_greek_two', nationality: 'GR', emailVerified: true });
  other = await User.create({ username: 'law_other', nationality: 'CY', emailVerified: true });
  unverified = await User.create({ username: 'law_unverified', nationality: 'GR', emailVerified: false });
  moderator = await User.create({ username: 'law_moderator', role: 'moderator', emailVerified: true });
  requestLibrary.mockImplementation(async (path, { search }) => {
    const params = new URLSearchParams(search);
    if (path !== '/api/laws/document' || params.get('scope') !== 'source') throw new Error('Unexpected library request');
    if (params.get('id') !== law.documentId) return new Response(null, { status: 404 });
    return Response.json({ document: { canonical_id: law.documentId, citation_label: 'Ν. 20/2026' },
      units: [parent, { id: paragraph.unitId, label: 'Παράγραφος 1', parent_id: parent.id }] });
  });
});

afterAll(async () => { await sequelize.close(); });

test('enforces session, nationality, CSRF, and exact source targets for votes', async () => {
  await request(app).get(targetQuery(law)).expect(401);
  await putVote(unverified, law, 'support').expect(403);
  await putVote(other, law, 'support').expect(403);
  await putVote(greek, law, 'support', false).expect(403);
  await putVote(greek, law, 'maybe').expect(400);
  await putVote(greek, { ...law, unitId: 'invented' }, 'support').expect(404);
});

test('updates one ballot per account and target and allows withdrawing it', async () => {
  await putVote(greek, law, 'support').expect(200);
  await putVote(greek, law, 'support').expect(200, {
    canVote: true, totals: { support: 1, oppose: 0 }, choice: 'support', reportPending: false,
  });
  await putVote(secondGreek, law, 'support').expect(200);
  await putVote(greek, law, 'oppose').expect(200, {
    canVote: true, totals: { support: 1, oppose: 1 }, choice: 'oppose', reportPending: false,
  });
  const article = { ...law, unitId: parent.id };
  await Promise.all([putVote(greek, article, 'support').expect(200), putVote(secondGreek, article, 'oppose').expect(200)]);
  await request(app).get(targetQuery(article)).set(auth(greek)).expect(200, {
    canVote: true, totals: { support: 1, oppose: 1 }, choice: 'support', reportPending: false,
  });
  await putVote(greek, paragraph, 'support').expect(200, {
    canVote: true, totals: { support: 1, oppose: 0 }, choice: 'support', reportPending: false,
  });
  await putVote(greek, law, null).expect(200, {
    canVote: true, totals: { support: 1, oppose: 0 }, choice: null, reportPending: false,
  });
  await request(app).get(targetQuery(law)).set(auth(other)).expect(200, {
    canVote: false, totals: { support: 1, oppose: 0 }, choice: null, reportPending: false,
  });
});

test('routes a private paragraph report to the moderation queue and rejects duplicates', async () => {
  const form = { ...paragraph, category: 'corruption_risk', message: 'Describe the risk and source.' };
  const submit = fields => request(app).post('/api/laws/feedback/report').set(auth(other)).send(fields);
  await submit({ ...form, message: ' ' }).expect(400);
  const submission = await submit(form).expect(201);
  expect(submission.body).toMatchObject({ reportPending: true });
  expect(submission.body).not.toHaveProperty('message');
  await submit({ ...form, category: 'misinformation' }).expect(409);
  await request(app).get(targetQuery(paragraph)).set(auth(greek)).expect(200).expect(res => {
    expect(res.body.reportPending).toBe(false);
  });
  await request(app).get('/api/reports?contentType=law').set(auth(other)).expect(403);
  const reviewed = await request(app).get('/api/reports?contentType=law').set(auth(moderator)).expect(200);
  expect(reviewed.body.data.pagination.total).toBe(1);
  const [report] = reviewed.body.data.reports;
  expect(report).toMatchObject({ category: form.category, message: form.message, lawTarget: {
    ...paragraph, label: 'Ν. 20/2026 · Άρθρο 2 · Παράγραφος 1',
  } });
  await request(app).post('/api/reports/' + report.id + '/review').set(auth(moderator)).send({ action: 'dismiss' }).expect(200);
  await submit(form).expect(201);
  await request(app).post('/api/reports/' + report.id + '/review').set(auth(moderator)).send({ action: 'reopen' }).expect(409);
  await request(app).post('/api/reports').set(auth(other)).send({ contentType: 'law', contentId: report.contentId, category: 'misinformation' }).expect(400);
});
