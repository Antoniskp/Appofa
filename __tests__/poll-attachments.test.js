const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const sharp = require('sharp');

// Isolate real filesystem writes from developer uploads.
const root = path.join(os.tmpdir(), `appofa-poll-attachments-${process.pid}`);
process.env.MEDIA_UPLOAD_ROOT = root;
const { sequelize, User, Poll, PollAttachment, Location, Organization, OrganizationMember } = require('../src/models');
const service = require('../src/services/pollAttachmentService');
const polls = require('../src/services/pollService');
const { storeCsrfToken } = require('../src/utils/csrf');
const app = express();
app.use(express.json());
app.use('/api/polls', require('../src/routes/pollRoutes'));
app.use('/uploads', express.static(root, require('../src/config/uploadStaticOptions')));
const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n');
let creator;
let other;
let photo;

function headers(user) {
  const csrf = `attachment-csrf-${user.id}`;
  storeCsrfToken(csrf, user.id);
  return { Authorization: `Bearer ${jwt.sign({ id: user.id, sessionVersion: user.sessionVersion }, process.env.JWT_SECRET)}`, Cookie: `csrf_token=${csrf}`, 'x-csrf-token': csrf };
}
function upload(buffer = pdf, filename = 'plan.pdf', contentType = 'application/pdf', user = creator) {
  return request(app).post('/api/polls/attachments').set(headers(user)).attach('file', buffer, { filename, contentType });
}
function pollData(attachments = [], extra = {}) {
  return { title: 'A proposal for the local park', type: 'simple', options: [{ text: 'Yes' }, { text: 'No' }], attachments, ...extra };
}
async function create(attachments = [], extra = {}) {
  const result = await polls.createPoll(creator.id, pollData(attachments, extra));
  expect(result.success).toBe(true);
  return result.data;
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
  creator = await User.create({ username: 'attachment-owner', email: 'attachment-owner@test.com', password: 'password123', role: 'user' });
  other = await User.create({ username: 'attachment-other', email: 'attachment-other@test.com', password: 'password123', role: 'user' });
  photo = await sharp({ create: { width: 30, height: 20, channels: 3, background: '#3678aa' } }).png().toBuffer();
});
afterEach(async () => {
  await PollAttachment.destroy({ where: {} });
  await Poll.destroy({ where: {} });
});
afterAll(async () => {
  await sequelize.close();
  await fs.rm(root, { recursive: true, force: true });
});

test('requires authentication and CSRF for uploads', async () => {
  await request(app).post('/api/polls/attachments').attach('file', pdf, 'plan.pdf').expect(401);
  await request(app).post('/api/polls/attachments').set('Authorization', headers(creator).Authorization).attach('file', pdf, 'plan.pdf').expect(403);
});

test('uploads real photos and PDFs; staged files are visible only to the uploader and never via static uploads', async () => {
  const image = (await upload(photo, 'park.png', 'image/png').expect(201)).body.attachment;
  const doc = (await upload().expect(201)).body.attachment;
  expect(image.mimeType).toBe('image/webp');
  expect(image.thumbnailUrl).toBeTruthy();
  expect(doc.originalName).toBe('plan.pdf');
  expect(doc).not.toHaveProperty('storageKey');
  await request(app).get(image.thumbnailUrl).expect(404);
  await request(app).get(image.url).set(headers(other)).expect(404);
  const response = await request(app).get(image.thumbnailUrl).set(headers(creator)).expect(200);
  expect(response.headers['content-type']).toContain('image/webp');
  expect(response.headers['cache-control']).toBe('private, no-store');
  const row = await PollAttachment.findByPk(doc.id);
  await request(app).get(`/uploads/.poll-attachments/${row.storageKey}`).expect(404);
  await request(app).get(`/uploads/%2epoll-attachments/${row.storageKey}`).expect(404);
});

test('rejects spoofed, unsupported, oversized, and empty uploads', async () => {
  await upload(Buffer.from('not a pdf')).expect(400);
  await upload(pdf, 'photo.png', 'image/png').expect(400);
  await upload(pdf, 'script.html', 'text/html').expect(400);
  await upload(Buffer.alloc(8 * 1024 * 1024 + 1), 'large.png', 'image/png').expect(413);
  await upload(Buffer.alloc(20 * 1024 * 1024 + 1)).expect(413);
  await upload(Buffer.alloc(0)).expect(400);
  expect(await PollAttachment.count()).toBe(0);
});

test.each(['simple', 'complex', 'binary'])('saves and returns attachments for %s polls', async type => {
  const doc = (await upload().expect(201)).body.attachment;
  const data = pollData([{ ...doc, title: 'Park proposal', caption: 'Please review before voting.' }], { type });
  if (type === 'binary') delete data.options;
  const result = await polls.createPoll(creator.id, data);
  expect(result.success).toBe(true);
  const response = await request(app).get(`/api/polls/${result.data.id}`).expect(200);
  expect(response.body.data.attachments).toEqual([expect.objectContaining({ id: doc.id, title: 'Park proposal', caption: 'Please review before voting.' })]);
  const opened = await request(app).get(doc.url).expect(200);
  expect(opened.headers['content-disposition']).toMatch(/^inline/);
  expect(opened.headers['content-security-policy']).toContain('sandbox');
  const downloaded = await request(app).get(`${doc.url}?download=true`).expect(200);
  expect(downloaded.headers['content-disposition']).toMatch(/^attachment/);
});

test('enforces live private visibility on files and thumbnails after a public poll changes', async () => {
  const image = (await upload(photo, 'park.png', 'image/png').expect(201)).body.attachment;
  const poll = await create([image]);
  await request(app).get(image.url).expect(200);
  expect((await polls.updatePoll(poll.id, creator.id, creator.role, { visibility: 'private' })).success).toBe(true);
  await request(app).get(image.url).expect(403);
  await request(app).get(image.thumbnailUrl).expect(403);
  await request(app).get(image.url).set(headers(other)).expect(200);
});

test('enforces local and organization membership visibility on direct file URLs', async () => {
  const doc = (await upload().expect(201)).body.attachment;
  const poll = await create([doc]);
  const location = await Location.create({ name: 'Attachment town', type: 'municipality', slug: 'attachment-town' });
  await Poll.update({ visibility: 'locals_only', locationId: location.id }, { where: { id: poll.id } });
  await request(app).get(doc.url).expect(403);
  await request(app).get(doc.url).set(headers(other)).expect(403);
  await other.update({ homeLocationId: location.id });
  await request(app).get(doc.url).set(headers(other)).expect(200);
  const org = await Organization.create({ name: 'Attachment group', slug: 'attachment-group', type: 'organization', createdByUserId: creator.id });
  await Poll.update({ visibility: 'private', organizationId: org.id }, { where: { id: poll.id } });
  await request(app).get(doc.url).expect(401);
  await request(app).get(doc.url).set(headers(other)).expect(403);
  await OrganizationMember.create({ organizationId: org.id, userId: other.id, role: 'member', status: 'active' });
  await request(app).get(doc.url).set(headers(other)).expect(200);
});

test('rejects stolen uploads, duplicate IDs and more than 10 attachments atomically', async () => {
  const doc = (await upload().expect(201)).body.attachment;
  const stolen = await polls.createPoll(other.id, pollData([doc]));
  expect(stolen.status).toBe(403);
  expect(await Poll.count()).toBe(0);
  expect((await PollAttachment.findByPk(doc.id)).pollId).toBeNull();
  expect((await polls.createPoll(creator.id, pollData([doc, doc]))).status).toBe(400);
  expect((await polls.createPoll(creator.id, pollData(Array(11).fill(doc)))).status).toBe(400);
  expect(await Poll.count()).toBe(0);
  await create([doc]);
  expect((await polls.createPoll(creator.id, pollData([doc]))).status).toBe(403);
  expect(await Poll.count()).toBe(1);
});

test('edits order and captions, preserves files on failed edits, removes files only after saving', async () => {
  const doc = (await upload().expect(201)).body.attachment;
  const image = (await upload(photo, 'park.png', 'image/png').expect(201)).body.attachment;
  const poll = await create([doc, image]);
  const failed = await polls.updatePoll(poll.id, creator.id, creator.role, { title: 'Changed title', attachments: [{ id: 'invalid' }] });
  expect(failed.status).toBe(400);
  expect((await Poll.findByPk(poll.id)).title).toBe(poll.title);
  await request(app).get(doc.url).expect(200);
  const changed = await polls.updatePoll(poll.id, creator.id, creator.role, { attachments: [{ ...image, caption: 'New caption' }, doc] });
  expect(changed.data.attachments.map(item => item.id)).toEqual([image.id, doc.id]);
  expect(changed.data.attachments[0].caption).toBe('New caption');
  const row = await PollAttachment.findByPk(doc.id);
  const removed = await polls.updatePoll(poll.id, creator.id, creator.role, { attachments: [image] });
  expect(removed.success).toBe(true);
  await request(app).get(doc.url).expect(404);
  await expect(fs.access(service.storagePath(row.storageKey))).rejects.toThrow();
  // An older client omitting attachments does not remove them.
  expect((await polls.updatePoll(poll.id, creator.id, creator.role, { description: 'New description' })).data.attachments).toHaveLength(1);
  expect((await polls.deletePoll(poll.id, creator.id, creator.role)).success).toBe(true);
  await request(app).get(image.url).expect(404);
});

test('only the uploader can remove unsaved files; saved attachments require a poll edit', async () => {
  const doc = (await upload().expect(201)).body.attachment;
  await request(app).delete(`/api/polls/attachments/${doc.id}`).set(headers(other)).expect(404);
  await request(app).delete(`/api/polls/attachments/${doc.id}`).set(headers(creator)).expect(200);
  await request(app).get(doc.url).set(headers(creator)).expect(404);
  const saved = (await upload().expect(201)).body.attachment;
  await create([saved]);
  await request(app).delete(`/api/polls/attachments/${saved.id}`).set(headers(creator)).expect(404);
});

test('cleans abandoned uploads after 24 hours and preserves saved and recent files', async () => {
  const expired = (await upload().expect(201)).body.attachment;
  const recent = (await upload().expect(201)).body.attachment;
  const saved = (await upload().expect(201)).body.attachment;
  await create([saved]);
  const row = await PollAttachment.findByPk(expired.id);
  await PollAttachment.update({ createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) }, { where: { id: expired.id }, silent: true });
  await service.cleanupAttachments();
  expect(await PollAttachment.findByPk(expired.id)).toBeNull();
  await expect(fs.access(service.storagePath(row.storageKey))).rejects.toThrow();
  expect(await PollAttachment.findByPk(recent.id)).toBeTruthy();
  expect(await PollAttachment.findByPk(saved.id)).toBeTruthy();
});
