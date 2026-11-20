const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { User } = require('../src/models');
const router = require('../src/routes/legalLibraryRoutes');

jest.mock('../src/models', () => ({ User: { findByPk: jest.fn() } }));
jest.mock('../src/services/ipAccessService', () => ({}));

const app = express();
app.use('/api/laws', router);

const originalOrigin = process.env.LAW_LIBRARY_BASE_URL;
const token = jwt.sign({ id: 1, sessionVersion: '0' }, process.env.JWT_SECRET);
const signedIn = path => request(app).get('/api/laws' + path).set('Cookie', 'auth_token=' + token);
const statusResponse = () => Response.json({
  storageEngine: 'Neo4j',
  databasePath: 'private-path',
  stats: { documents: 82 },
});

let port = 45000;

beforeEach(() => {
  process.env.LAW_LIBRARY_BASE_URL = 'http://127.0.0.1:' + port++;
  User.findByPk.mockResolvedValue({ id: 1, emailVerified: true, sessionVersion: '0' });
  jest.spyOn(global, 'fetch').mockImplementation(async () => statusResponse());
});

afterEach(() => {
  if (originalOrigin === undefined) delete process.env.LAW_LIBRARY_BASE_URL;
  else process.env.LAW_LIBRARY_BASE_URL = originalOrigin;
  jest.restoreAllMocks();
  User.findByPk.mockReset();
});

test('exposes only a cached availability flag to signed-out visitors', async () => {
  await request(app).get('/api/laws/availability').expect(200, { online: true });
  await request(app).get('/api/laws/availability').expect(200, { online: true });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(User.findByPk).not.toHaveBeenCalled();
});

test('requires a live, email-verified session for the reader, assets and data', async () => {
  await request(app).get('/api/laws/view').expect(302).expect('Location', '/login?next=%2Flaws');
  await request(app).get('/api/laws/view/app.js').expect(401).expect('Cache-Control', 'private, no-store');
  await request(app).get('/api/laws/document?id=law:1:2020').expect(401);
  User.findByPk.mockResolvedValue({ id: 1, role: 'admin', isVerified: true, emailVerified: false, sessionVersion: '0' });
  await signedIn('/view').expect(302).expect('Location', '/profile#email-verification');
  await signedIn('/documents').expect(403);
  User.findByPk.mockResolvedValue({ id: 1, emailVerified: true, sessionVersion: '1' });
  await signedIn('/documents').expect(401);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('opens the online reader and limits verified accounts to read-only content', async () => {
  global.fetch.mockImplementation(async url => {
    if (url.pathname === '/api/laws/status') return statusResponse();
    if (url.pathname === '/laws') return new Response('<title>Appofasistis</title>', { headers: { 'Content-Type': 'text/html' } });
    if (url.pathname === '/laws/app.js') {
      return new Response("const tabs = [['overview', 'Overview'], ['notes', 'Notes']];", {
        headers: { 'Content-Type': 'text/javascript' },
      });
    }
    return Response.json({
      document: { title: 'Law' }, sourceText: 'Law text', units: [], references: [], incoming: [],
      attachments: [{ id: 'file', local_file: 'private-name.pdf' }],
      annotation: { notes: 'Private note' }, revisions: [{ notes: 'Private revision' }],
    });
  });
  await signedIn('/view').expect(200).expect('Cache-Control', 'private, no-store').expect('<title>Appofasistis</title>');
  await signedIn('/view/app.js').expect(200).expect("const tabs = [['overview', 'Overview']];");
  const status = await signedIn('/status').expect(200);
  expect(status.body).not.toHaveProperty('databasePath');
  const document = await signedIn('/document?id=law%3A1%3A2020').expect(200);
  expect(document.body).toMatchObject({
    sourceText: 'Law text', annotation: { notes: '' }, revisions: [],
    attachments: [{ id: 'file', local_file: true }],
  });
  expect(global.fetch.mock.calls.at(-1)[0].searchParams.get('id')).toBe('law:1:2020');
  expect(global.fetch.mock.calls.at(-1)[1]).not.toHaveProperty('headers');
  await request(app).post('/api/laws/import').set('Cookie', 'auth_token=' + token).expect(404);
  await signedIn('/backups/greek-laws-private.json').expect(404);
  expect(global.fetch).toHaveBeenCalledTimes(4);
});

test('checks for an outage again when a verified user opens the reader', async () => {
  await request(app).get('/api/laws/availability').expect(200, { online: true });
  global.fetch.mockRejectedValue(new Error('Worker offline'));
  await signedIn('/view').expect(503);
  await request(app).get('/api/laws/availability').expect(200, { online: false });
});
