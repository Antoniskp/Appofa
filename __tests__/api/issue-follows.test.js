const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { sequelize, User, Poll, Suggestion } = require('../../src/models');
const IssueFollow = require('../../src/models/IssueFollow');
const { storeCsrfToken } = require('../../src/utils/csrf');
const app = express();
app.use(express.json());
app.use('/api/issue-follows', require('../../src/routes/issueFollowRoutes'));
let user, other, poll, proposal;
const token = u => jwt.sign({ id: u.id, sessionVersion: u.sessionVersion }, process.env.JWT_SECRET);
function put(u, path, following) {
  const csrf = `issue-follow-${u.id}`;
  storeCsrfToken(csrf, u.id);
  return request(app).put(`/api/issue-follows/${path}`).set('Authorization', `Bearer ${token(u)}`).set('Cookie', `csrf_token=${csrf}`).set('x-csrf-token', csrf).send({ following });
}
const get = (u, path = '') => request(app).get(`/api/issue-follows${path}`).set('Authorization', `Bearer ${token(u)}`);
beforeAll(async () => {
  await sequelize.sync({ force: true });
  user = await User.create({ username: 'follow_owner', email: 'follow@test.com' });
  other = await User.create({ username: 'follow_other', email: 'other@test.com' });
  poll = await Poll.create({ title: 'Public test poll', creatorId: user.id, visibility: 'public' });
  proposal = await Suggestion.create({ title: 'Public proposal', body: 'A concrete next step', authorId: user.id });
});
afterAll(() => sequelize.close());
test('requires authentication and CSRF on mutations', async () => {
  expect((await request(app).get('/api/issue-follows')).status).toBe(401);
  expect((await request(app).put(`/api/issue-follows/poll/${poll.id}`).set('Authorization', `Bearer ${token(user)}`).send({ following: true })).status).toBe(403);
});
test('following is idempotent and isolated by account', async () => {
  expect((await put(user, `poll/${poll.id}`, true)).status).toBe(200);
  expect((await put(user, `poll/${poll.id}`, true)).status).toBe(200);
  expect(await IssueFollow.count()).toBe(1);
  expect((await get(user)).body.data).toHaveLength(1);
  expect((await get(other)).body.data).toHaveLength(0);
  expect((await put(other, `poll/${poll.id}`, false)).status).toBe(200);
  expect((await get(user, `/poll/${poll.id}`)).body.data.following).toBe(true);
});
test('private targets cannot be followed and disappear from the feed', async () => {
  await poll.update({ visibility: 'private' });
  expect((await get(user)).body.data).toHaveLength(0);
  expect((await put(other, `poll/${poll.id}`, true)).status).toBe(404);
  await poll.update({ visibility: 'public' });
});
test('proposal progress is returned and unfollow removes the subscription', async () => {
  expect((await put(user, `suggestion/${proposal.id}`, true)).status).toBe(200);
  await proposal.update({ progress: { stage: 'discussion', note: 'Discussion opened', revision: 1, history: [] } });
  const result = (await get(user)).body.data.find(item => item.entityType === 'suggestion');
  expect(result.progress.note).toBe('Discussion opened');
  expect((await put(user, `suggestion/${proposal.id}`, false)).body.data.following).toBe(false);
});
test('rejects invalid types, ids, and non-boolean state', async () => {
  expect((await put(user, 'constructor/1', true)).status).toBe(400);
  expect((await put(user, 'poll/1.2', true)).status).toBe(400);
  expect((await put(user, `poll/${poll.id}`, 'true')).status).toBe(400);
});
