const request = require('supertest');
const express = require('express');
const { sequelize, User, Location, Suggestion, Poll, PollOption, CivicQuestion, Solution, Organization, OrganizationMember } = require('../src/models');
const { updateProgress } = require('../src/services/proposalProgressService');
const { votePoll } = require('../src/services/pollService');
const { voteCivicQuestion } = require('../src/services/civicQuestionService');
const progressController = require('../src/controllers/proposalProgressController');
const suggestionController = require('../src/controllers/suggestionController');

describe('Democracy first release', () => {
  let author, admin, other, location, proposal, poll, option;
  const draft = overrides => ({ revision: 0, stage: 'discussion', responsibleBody: '', response: '', cost: '', milestones: '', evidenceUrl: '', note: 'Opened discussion', decisionPollId: '', responseDeadline: '', ...overrides });
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    location = await Location.create({ name: 'Community', slug: 'community', type: 'municipality' });
    author = await User.create({ username: 'author', email: 'author@example.test', password: 'password123', role: 'viewer', homeLocationId: location.id });
    admin = await User.create({ username: 'admin', email: 'admin@example.test', password: 'password123', role: 'admin' });
    other = await User.create({ username: 'other', email: 'other@example.test', password: 'password123', role: 'viewer' });
    poll = await Poll.create({ title: 'Community consultation', creatorId: author.id, locationId: location.id, voteRestriction: 'locals_only' });
    option = await PollOption.create({ pollId: poll.id, text: 'Support', order: 0 });
  });
  beforeEach(async () => {
    proposal = await Suggestion.create({ title: 'Community proposal', body: 'A practical local proposal.', authorId: author.id, locationId: location.id });
  });
  afterAll(() => sequelize.close());

  it('does not grant administrators local poll voting eligibility', async () => {
    expect(await votePoll(poll.id, option.id, admin.id, 'admin', '127.0.0.1', 'test')).toMatchObject({ success: false, status: 403 });
    expect(await votePoll(poll.id, option.id, author.id, 'viewer', '127.0.0.1', 'test')).toMatchObject({ success: true });
  });
  it('does not grant administrators local civic-question voting eligibility', async () => {
    const question = await CivicQuestion.create({ title: 'A local civic question', creatorId: author.id, locationId: location.id, voteRestriction: 'locals_only' });
    expect(await voteCivicQuestion(question.id, admin, { choice: 'agree' })).toMatchObject({ success: false, status: 403 });
  });
  it('requires active organization membership even for administrators', async () => {
    const organization = await Organization.create({ name: 'Community group', slug: 'community-group', type: 'organization', createdByUserId: author.id });
    const orgPoll = await Poll.create({ title: 'Members consultation', creatorId: author.id, organizationId: organization.id });
    const orgOption = await PollOption.create({ pollId: orgPoll.id, text: 'Support', order: 0 });
    expect(await votePoll(orgPoll.id, orgOption.id, admin.id, 'admin', '127.0.0.1', 'test')).toMatchObject({ success: false, status: 403 });
    await OrganizationMember.create({ organizationId: organization.id, userId: admin.id, status: 'active' });
    expect(await votePoll(orgPoll.id, orgOption.id, admin.id, 'admin', '127.0.0.1', 'test')).toMatchObject({ success: true });
  });
  it('enforces local eligibility for proposals and their solutions', async () => {
    await proposal.update({ voteRestriction: 'locals_only' });
    const solution = await Solution.create({ suggestionId: proposal.id, body: 'Practical solution', authorId: author.id });
    const app = express();
    app.use(express.json(), (req, res, next) => { req.user = admin; next(); });
    app.post('/proposal/:id', suggestionController.voteSuggestion);
    app.post('/solution/:id', suggestionController.voteSolution);
    expect((await request(app).post(`/proposal/${proposal.id}`).send({ value: 1 })).status).toBe(403);
    expect((await request(app).post(`/solution/${solution.id}`).send({ value: 1 })).status).toBe(403);
  });
  it('preserves full snapshots and rejects stale writes', async () => {
    const first = await updateProgress(proposal.id, author, draft());
    const second = await updateProgress(proposal.id, author, draft({ revision: 1, stage: 'voting', decisionPollId: poll.id, note: 'Consultation opened' }));
    expect(second.progress.history).toHaveLength(2);
    expect(second.progress.history[0]).toEqual(first.progress.history[0]);
    expect(second.status).toBe('under_review');
    await expect(updateProgress(proposal.id, author, draft())).rejects.toMatchObject({ status: 409 });
  });
  it('rejects updates from unrelated users', async () => {
    await expect(updateProgress(proposal.id, other, draft())).rejects.toMatchObject({ status: 403 });
  });
  it('requires reasons, delivery milestones and completion evidence', async () => {
    await expect(updateProgress(proposal.id, author, draft({ note: '' }))).rejects.toMatchObject({ status: 400 });
    await expect(updateProgress(proposal.id, author, draft({ stage: 'rejected' }))).rejects.toMatchObject({ status: 400 });
    const response = { responsibleBody: 'Council', response: 'Accepted for delivery' };
    await expect(updateProgress(proposal.id, author, draft({ ...response, stage: 'delivery' }))).rejects.toMatchObject({ status: 400 });
    await expect(updateProgress(proposal.id, author, draft({ ...response, stage: 'completed' }))).rejects.toMatchObject({ status: 400 });
    const complete = await updateProgress(proposal.id, author, draft({ ...response, stage: 'completed', evidenceUrl: 'https://example.org/report' }));
    expect(complete.status).toBe('implemented');
  });
  it('rejects unsafe links, invalid dates and invalid consultation IDs', async () => {
    for (const invalid of [{ evidenceUrl: 'javascript:alert(1)' }, { responseDeadline: '2026-02-30' }, { decisionPollId: 'not-a-number' }]) {
      await expect(updateProgress(proposal.id, author, draft(invalid))).rejects.toMatchObject({ status: 400 });
    }
  });
  it('rejects private and out-of-scope linked consultations', async () => {
    const privatePoll = await Poll.create({ title: 'Private consultation', creatorId: author.id, locationId: location.id, visibility: 'private' });
    await expect(updateProgress(proposal.id, author, draft({ decisionPollId: privatePoll.id }))).rejects.toMatchObject({ status: 400 });
    const elsewhere = await Poll.create({ title: 'Elsewhere consultation', creatorId: author.id });
    await expect(updateProgress(proposal.id, author, draft({ decisionPollId: elsewhere.id }))).rejects.toMatchObject({ status: 400 });
  });
  it('excludes restricted proposals from the public progress feed', async () => {
    await updateProgress(proposal.id, author, draft());
    await proposal.reload();
    await proposal.update({ visibility: 'private' });
    const app = express();
    app.get('/progress', progressController.list);
    const result = await request(app).get('/progress');
    expect(result.status).toBe(200);
    expect(result.body.data.some(row => row.id === proposal.id)).toBe(false);
    await proposal.update({ visibility: 'public' });
    expect((await request(app).get('/progress')).body.data.some(row => row.id === proposal.id)).toBe(true);
  });
  it('applies and rolls back the nullable progress migration idempotently', async () => {
    const migration = require('../src/migrations/20260920000000-add-proposal-progress');
    const qi = sequelize.getQueryInterface();
    await migration.down(qi);
    expect((await qi.describeTable('Suggestions')).progress).toBeUndefined();
    await migration.up(qi, require('sequelize'));
    await migration.up(qi, require('sequelize'));
    expect((await qi.describeTable('Suggestions')).progress.allowNull).toBe(true);
  });
});
