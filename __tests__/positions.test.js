const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { sequelize, User, Organization, OrganizationMember, PolicyCategory, Topic, PositionRevision, PositionVote, PositionSource } = require('../src/models');
const service = require('../src/services/positionService');
const { storeCsrfToken } = require('../src/utils/csrf');
const app = express();
app.use(express.json());
app.use('/api/positions', require('../src/routes/positionRoutes'));

describe('Organization positions workflow', () => {
  let owner, viewer, admin, category, topic, org;
  let sequence = 0;
  const input = (overrides = {}) => ({
    categoryId: category.id, topicIds: [topic.id], title: 'Build public rental homes',
    body: 'Create affordable public rental housing.', attribution: 'sourced',
    sources: [{ provider: 'vouliwatch', sourceUrl: 'https://vouliwatch.gr/policies', originalSourceUrl: 'https://example.org/programme' }],
    ...overrides,
  });
  const headers = user => {
    const csrf = 'position-csrf-' + user.id;
    storeCsrfToken(csrf, user.id);
    const token = jwt.sign({ id: user.id, sessionVersion: user.sessionVersion }, process.env.JWT_SECRET);
    return { Cookie: ['auth_token=' + token, 'csrf_token=' + csrf], 'x-csrf-token': csrf };
  };
  const publish = revisionId => service.mutateRevision(revisionId, { sourcesVerified: true }, owner, 'publish');
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    owner = await User.create({ username: 'position-owner', role: 'viewer' });
    viewer = await User.create({ username: 'position-viewer', role: 'viewer' });
    admin = await User.create({ username: 'position-admin', role: 'admin' });
    category = await PolicyCategory.create({ name: 'Housing', slug: 'housing' });
    topic = await Topic.create({ name: 'Public housing', slug: 'public-housing' });
  });
  beforeEach(async () => {
    org = await Organization.create({ name: 'Policy party', slug: 'policy-party-' + (++sequence), type: 'party', createdByUserId: owner.id });
    await OrganizationMember.create({ organizationId: org.id, userId: owner.id, role: 'owner' });
  });
  afterAll(async () => { await sequelize.close(); });

  test('drafts stay private and only managers may write; mutations require authentication and CSRF', async () => {
    const created = await service.create(org.id, input(), owner);
    expect((await service.list({ organizationId: org.id }, viewer)).positions).toHaveLength(0);
    expect((await service.list({ organizationId: org.id, manage: 'true' }, owner)).positions).toHaveLength(1);
    await expect(service.list({ organizationId: org.id, manage: 'true' }, viewer)).rejects.toMatchObject({ status: 403 });
    await expect(service.create(org.id, input(), viewer)).rejects.toMatchObject({ status: 403 });
    expect((await request(app).put('/api/positions/revisions/' + created.revisionId + '/vote').send({ value: 1 })).status).toBe(401);
    const token = jwt.sign({ id: owner.id }, process.env.JWT_SECRET);
    expect((await request(app).post('/api/positions/organizations/' + org.id).set('Cookie', 'auth_token=' + token).send(input())).status).toBe(403);
  });

  test('publish, vote, change vote, remove vote, and serialize only the current user vote', async () => {
    const created = await service.create(org.id, input(), owner);
    await expect(service.vote(created.revisionId, 1, viewer)).rejects.toMatchObject({ status: 409 });
    await expect(service.mutateRevision(created.revisionId, {}, owner, 'publish')).rejects.toMatchObject({ status: 400 });
    await publish(created.revisionId);
    const response = await request(app).put('/api/positions/revisions/' + created.revisionId + '/vote').set(headers(viewer)).send({ value: 1 });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ value: 1, support: 1, oppose: 0 });
    let result = await service.list({ organizationId: org.id }, viewer);
    expect(result.positions[0]).toMatchObject({ support: 1, oppose: 0, myVote: 1 });
    expect(result.positions[0].votes).toBeUndefined();
    expect(result.positions[0].createdByUserId).toBeUndefined();
    expect((await service.list({ organizationId: org.id }, owner)).positions[0].myVote).toBe(0);
    await service.vote(created.revisionId, -1, viewer);
    result = await service.list({ organizationId: org.id }, viewer);
    expect(result.positions[0]).toMatchObject({ support: 0, oppose: 1, myVote: -1 });
    expect(await service.vote(created.revisionId, 2, viewer)).toMatchObject({ support: 0, oppose: 0, unsure: 1 });
    const undecided = await service.list({ voteView: 'unsure' }, viewer);
    expect(undecided.positions[0]).toMatchObject({ myVote: 2, unsure: 1 });
    await service.vote(created.revisionId, 0, viewer);
    expect(await PositionVote.count({ where: { revisionId: created.revisionId } })).toBe(0);
  });

  test('profile totals and detail exclude drafts and votes from superseded revisions', async () => {
    const first = await service.create(org.id, input(), owner);
    await service.create(org.id, input(), owner);
    await expect(service.detail(first.positionId, viewer)).rejects.toMatchObject({ status: 404 });
    await publish(first.revisionId);
    await service.vote(first.revisionId, 1, viewer);
    await service.vote(first.revisionId, -1, owner);
    expect(await service.summary(org.id, viewer)).toEqual({ positions: 1, support: 1, oppose: 1 });
    const next = await service.revise(first.positionId, input(), owner);
    await publish(next.revisionId);
    expect(await service.detail(first.positionId, viewer)).toMatchObject({ id: next.revisionId });
    expect(await service.summary(org.id, viewer)).toEqual({ positions: 1, support: 0, oppose: 0 });
  });

  test('search matches title and body before pagination and treats wildcard characters literally', async () => {
    const created = await service.create(org.id, input({ title: 'Rental support 80% plan', body: 'A UNIQUE_HOUSING proposal.' }), owner);
    await publish(created.revisionId);
    for (const search of ['rental', 'unique_housing', '80%']) {
      const result = await service.list({ organizationId: org.id, search }, viewer);
      expect(result.pagination.total).toBe(1);
      expect(result.positions[0].id).toBe(created.revisionId);
    }
    expect((await service.list({ organizationId: org.id, search: 'missing' }, viewer)).pagination.total).toBe(0);
    expect((await service.list({ organizationId: org.id, search: '___' }, viewer)).positions).toHaveLength(0);
    await expect(service.list({ search: 'a'.repeat(201) }, viewer)).rejects.toMatchObject({ status: 400 });
  });

  test('new versions preserve old votes and prevent editing or voting on old versions', async () => {
    const created = await service.create(org.id, input(), owner);
    await publish(created.revisionId);
    await service.vote(created.revisionId, 1, viewer);
    await expect(service.mutateRevision(created.revisionId, input(), owner, 'save')).rejects.toMatchObject({ status: 409 });
    const updated = await service.revise(created.positionId, input({ body: 'A changed commitment.' }), owner);
    await publish(updated.revisionId);
    expect((await service.list({ organizationId: org.id }, viewer)).positions[0]).toMatchObject({ version: 2, support: 0, myVote: 0 });
    await expect(service.vote(created.revisionId, -1, viewer)).rejects.toMatchObject({ status: 409 });
    const versions = await service.history(created.positionId, viewer);
    expect(versions.map(row => row.status)).toEqual(['published', 'superseded']);
    expect(Number(versions[1].get('support'))).toBe(1);
    expect(await PositionSource.count({ where: { revisionId: created.revisionId, reviewStatus: 'verified' } })).toBe(1);
  });

  test('official attribution requires organization membership even for platform administrators', async () => {
    await expect(service.create(org.id, input({ attribution: 'official' }), admin)).rejects.toMatchObject({ status: 403 });
    const created = await service.create(org.id, input({ attribution: 'official' }), owner);
    await expect(service.mutateRevision(created.revisionId, { sourcesVerified: true }, admin, 'publish')).rejects.toMatchObject({ status: 403 });
    await publish(created.revisionId);
    expect((await PositionRevision.findByPk(created.revisionId)).attribution).toBe('official');
  });

  test('private organization positions never leak through global lists or direct history', async () => {
    await org.update({ isPublic: false });
    const created = await service.create(org.id, input(), owner);
    await publish(created.revisionId);
    const global = await service.list({}, viewer);
    expect(global.positions.some(row => row.position.organization.id === org.id)).toBe(false);
    await expect(service.list({ organizationId: org.id }, viewer)).rejects.toMatchObject({ status: 404 });
    await expect(service.history(created.positionId, viewer)).rejects.toMatchObject({ status: 404 });
    await expect(service.vote(created.revisionId, 1, viewer)).rejects.toMatchObject({ status: 404 });
    expect((await service.list({ organizationId: org.id }, owner)).positions).toHaveLength(1);
  });

  test('category/topic filters, all ranking modes, and multi-topic pagination return unique positions', async () => {
    const extraTopic = await Topic.create({ name: 'Social housing', slug: 'social-housing' });
    const created = await service.create(org.id, input({ topicIds: [topic.id, extraTopic.id] }), owner);
    await publish(created.revisionId);
    await service.vote(created.revisionId, 1, viewer);
    for (const sort of ['top', 'support', 'approval', 'divisive', 'newest']) {
      const result = await service.list({ organizationId: org.id, categoryId: category.id, topicId: topic.id, sort }, viewer);
      expect(result.positions).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    }
    const all = await service.list({ organizationId: org.id }, viewer);
    expect(all.positions).toHaveLength(1);
    expect(all.positions[0].position.topics).toHaveLength(2);
    expect((await service.list({ organizationId: org.id, topicId: 99999 }, viewer)).positions).toHaveLength(0);
  });

  test('top ranking discounts small samples and pagination counts positions once', async () => {
    const small = await service.create(org.id, input({ title: 'Small sample proposal' }), owner);
    const broad = await service.create(org.id, input({ title: 'Broad support proposal' }), owner);
    await publish(small.revisionId);
    await publish(broad.revisionId);
    const voters = await User.bulkCreate(Array.from({ length: 20 }, (_, index) => ({ username: 'ranking-voter-' + index })));
    await PositionVote.bulkCreate(voters.map((voter, index) => ({ revisionId: broad.revisionId, userId: voter.id, value: index < 17 ? 1 : -1 })));
    await PositionVote.bulkCreate(voters.slice(0, 3).map(voter => ({ revisionId: small.revisionId, userId: voter.id, value: 1 })));
    expect((await service.list({ organizationId: org.id, sort: 'top' }, viewer)).positions[0].id).toBe(broad.revisionId);
    for (let index = 0; index < 11; index++) {
      const created = await service.create(org.id, input({ title: 'Additional proposal ' + index }), owner);
      await publish(created.revisionId);
    }
    const shuffled = async (seed, page = 1) => (await service.list({ organizationId: org.id, sort: 'shuffle', seed, page }, viewer)).positions.map(row => row.id);
    const pageOne = await shuffled(12345);
    expect(await shuffled(12345)).toEqual(pageOne);
    expect(new Set([...pageOne, ...await shuffled(12345, 2)]).size).toBe(13);
    expect(await shuffled(2147483646)).not.toEqual(pageOne);
    const first = await service.list({ organizationId: org.id, sort: 'support' }, viewer);
    const second = await service.list({ organizationId: org.id, sort: 'support', page: 2 }, viewer);
    expect(first.pagination).toEqual({ page: 1, pages: 2, total: 13 });
    expect(first.positions).toHaveLength(12);
    expect(second.positions).toHaveLength(1);
    expect(new Set([...first.positions, ...second.positions].map(row => row.id)).size).toBe(13);
  });

  test('withdrawal disables voting and public listing; review rejection remains editable', async () => {
    const created = await service.create(org.id, input(), owner);
    await service.mutateRevision(created.revisionId, { reviewNote: 'Check date.' }, owner, 'reject');
    await service.mutateRevision(created.revisionId, input({ body: 'Corrected details.' }), owner, 'save');
    expect((await PositionRevision.findByPk(created.revisionId)).status).toBe('draft');
    await publish(created.revisionId);
    await service.changeStatus(created.positionId, 'withdrawn', owner);
    expect((await service.list({ organizationId: org.id }, viewer)).positions).toHaveLength(0);
    await expect(service.vote(created.revisionId, 1, viewer)).rejects.toMatchObject({ status: 409 });
    await service.changeStatus(created.positionId, 'active', owner);
    await service.vote(created.revisionId, 1, viewer);
  });

  test('invalid URLs, missing sources and unknown topics are rejected without partial writes', async () => {
    await expect(service.create(org.id, input({ sources: [{ sourceUrl: 'javascript:alert(1)' }] }), owner)).rejects.toMatchObject({ status: 400 });
    await expect(service.create(org.id, input({ sources: [] }), owner)).rejects.toMatchObject({ status: 400 });
    await expect(service.create(org.id, input({ topicIds: [99999] }), owner)).rejects.toMatchObject({ status: 400 });
    expect((await service.list({ organizationId: org.id, manage: 'true' }, owner)).positions).toHaveLength(0);
  });
});
