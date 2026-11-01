const express = require('express');
const request = require('supertest');
const { sequelize, Suggestion, User, Location, MediaAsset } = require('../src/models');
const { resolvePhotos } = require('../src/services/suggestionPhotoService');
const { updateProgress } = require('../src/services/proposalProgressService');
const { deleteMediaAsset } = require('../src/services/mediaService');
const controller = require('../src/controllers/suggestionController');
const app = express();
app.use(express.json());
let author, other, location, report, asset;
app.get('/nearby', require('../src/controllers/nearbySuggestionController').list);
app.patch('/:id', (req, res, next) => { req.user = author; next(); }, controller.updateSuggestion);
const draft = overrides => ({ stage: 'completed', revision: 0, responsibleBody: 'Municipality', response: 'Repair completed', note: 'Inspected the repair', cost: '', milestones: '', evidenceUrl: '', responseDeadline: '', decisionPollId: '', ...overrides });

beforeAll(async () => {
  await sequelize.sync({ force: true });
  author = await User.create({ username: 'reporter', email: 'reporter@test.com', password: 'Test1234!', role: 'viewer' });
  other = await User.create({ username: 'other', email: 'other@test.com', password: 'Test1234!', role: 'viewer' });
  location = await Location.create({ name: 'Athens', slug: 'athens-report', type: 'municipality' });
  asset = await MediaAsset.create({ storageKey: 'test-report-photo.webp', url: '/uploads/test-report-photo.webp', mimeType: 'image/webp', size: 10, uploadedByUserId: author.id });
});
beforeEach(async () => {
  await Suggestion.destroy({ where: {} });
  report = await Suggestion.create({ title: 'Broken street light', body: 'Light is broken on this street.', type: 'problem', locationId: location.id, authorId: author.id, mapLat: 37.98, mapLng: 23.72, mapIssueType: 'broken_lighting' });
});
afterAll(async () => sequelize.close());

test('nearby reports exclude private, resolved and distant reports and validate coordinates', async () => {
  for (const overrides of [{ visibility: 'private' }, { status: 'implemented' }, { mapLat: 38.1 }]) {
    await Suggestion.create({ title: 'Another report', body: 'Another street problem', type: 'problem', authorId: author.id, mapLat: 37.98, mapLng: 23.72, ...overrides });
  }
  const response = await request(app).get('/nearby?lat=37.98&lng=23.72');
  expect(response.status).toBe(200);
  expect(response.body.data.map(item => item.id)).toEqual([report.id]);
  expect(response.body.data[0].distance).toBe(0);
  expect((await request(app).get(`/nearby?lat=37.98&lng=23.72&excludeId=${report.id}`)).body.data).toEqual([]);
  expect((await request(app).get('/nearby?lat=&lng=23')).status).toBe(400);
});

test('photos use server URLs, enforce ownership and reject malformed input', async () => {
  const input = [{ id: asset.id, url: 'https://untrusted.example/image', kind: 'report', caption: ' Before ' }];
  expect(await resolvePhotos(input, author)).toEqual([{ id: asset.id, url: asset.url, kind: 'report', caption: 'Before' }]);
  await expect(resolvePhotos(input, other)).rejects.toMatchObject({ status: 400 });
  await expect(resolvePhotos(Array(7).fill(input[0]), author)).rejects.toMatchObject({ status: 400 });
  await expect(resolvePhotos([{ ...input[0], kind: 'unknown' }], author)).rejects.toMatchObject({ status: 400 });
});

test('pin corrections persist and removing a location cannot leave an orphan pin', async () => {
  expect((await request(app).patch(`/${report.id}`).send({ mapLat: 37.981, mapLng: 23.721 })).status).toBe(200);
  await report.reload();
  expect(Number(report.mapLat)).toBe(37.981);
  expect((await request(app).patch(`/${report.id}`).send({ locationId: null })).status).toBe(400);
  expect((await request(app).patch(`/${report.id}`).send({ locationId: null, mapLat: null, mapLng: null, mapIssueType: null })).status).toBe(200);
});

test('status changes require history and completion requires evidence', async () => {
  expect((await request(app).patch(`/${report.id}`).send({ status: 'implemented' })).status).toBe(409);
  await expect(updateProgress(report.id, author, draft())).rejects.toMatchObject({ status: 400 });
  await expect(updateProgress(report.id, other, draft())).rejects.toMatchObject({ status: 403 });
  const photos = await resolvePhotos([{ id: asset.id, kind: 'repair', caption: 'Repaired light' }], author);
  await report.update({ photos });
  const result = await updateProgress(report.id, author, draft());
  expect(result.status).toBe('implemented');
  expect(result.progress.history[0]).toMatchObject({ responsibleBody: 'Municipality', repairPhotos: photos });
  await expect(updateProgress(report.id, author, draft())).rejects.toMatchObject({ status: 409 });
  await report.update({ photos: [] });
  expect((await deleteMediaAsset(asset.id, author)).status).toBe(409);
});
