const { Sequelize, DataTypes: S } = require('sequelize');
const migration = require('../src/migrations/20261101000000-create-organization-positions');
const categorySeed = require('../src/migrations/20261101010000-seed-policy-categories');

describe('Organization position migration', () => {
  let db;
  let qi;
  const insert = (table, fields) => qi.bulkInsert(table, [{
    ...fields, createdAt: new Date(), updatedAt: new Date(),
  }]);

  beforeEach(async () => {
    db = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    qi = db.getQueryInterface();
    for (const table of ['Organizations', 'Locations', 'Suggestions', 'Users', 'Topics']) {
      await qi.createTable(table, { id: { type: S.INTEGER, primaryKey: true } });
      await qi.bulkInsert(table, [{ id: 1 }]);
    }
    await migration.up(qi, Sequelize);
    await insert('PolicyCategories', { id: 1, name: 'Housing', slug: 'housing' });
    await insert('OrganizationPositions', { id: 1, organizationId: 1, categoryId: 1 });
    await insert('PositionRevisions', { id: 1, positionId: 1, version: 1, title: 'Build public housing', body: 'A proposal.' });
  });
  afterEach(async () => { await db.close(); });

  test('expanded responses preserve votes and the one-answer constraint', async () => {
    const expansion = require('../src/migrations/20261106000000-expand-policy-responses');
    await insert('PositionVotes', { revisionId: 1, userId: 1, value: -1 });
    await expansion.up(qi);
    const [rows] = await db.query('SELECT value FROM PositionVotes');
    expect(rows[0].value).toBe(-1);
    await qi.bulkUpdate('PositionVotes', { value: 2 }, { revisionId: 1 });
    await expect(insert('PositionVotes', { revisionId: 1, userId: 1, value: 1 })).rejects.toThrow();
    await expansion.down(qi);
    await expect(insert('PositionVotes', { revisionId: 1, userId: 1, value: 2 })).rejects.toThrow();
  });

  test('imports default to drafts with pending source review', async () => {
    await insert('PositionSources', {
      revisionId: 1, provider: 'vouliwatch', sourceUrl: 'https://vouliwatch.gr/policies',
      retrievedAt: new Date(), contentFingerprint: 'abc',
    });
    const [revisions] = await db.query('SELECT status, attribution FROM PositionRevisions');
    const [sources] = await db.query('SELECT reviewStatus FROM PositionSources');
    expect(revisions[0]).toEqual({ status: 'draft', attribution: 'sourced' });
    expect(sources[0].reviewStatus).toBe('pending');
  });

  test('votes are unique per user and revision, private by default, and retain history', async () => {
    await insert('PositionVotes', { revisionId: 1, userId: 1, value: 1 });
    await expect(insert('PositionVotes', { revisionId: 1, userId: 1, value: -1 })).rejects.toThrow();
    await insert('PositionRevisions', { id: 2, positionId: 1, version: 2, title: 'Revised housing proposal', body: 'Changed commitment.' });
    await insert('PositionVotes', { revisionId: 2, userId: 1, value: -1 });
    const [votes] = await db.query('SELECT value, identityVisibility FROM PositionVotes ORDER BY revisionId');
    expect(votes).toEqual([{ value: 1, identityVisibility: 'anonymous' }, { value: -1, identityVisibility: 'anonymous' }]);
    await expect(qi.bulkDelete('PositionRevisions', { id: 1 })).rejects.toThrow();
  });

  test('database rejects invalid votes, orphan references, and duplicate versions', async () => {
    await expect(insert('PositionVotes', { revisionId: 1, userId: 1, value: 0 })).rejects.toThrow();
    await expect(insert('PositionVotes', { revisionId: 999, userId: 1, value: 1 })).rejects.toThrow();
    await expect(insert('PositionRevisions', { positionId: 1, version: 1, title: 'Duplicate', body: 'Duplicate.' })).rejects.toThrow();
    await expect(insert('PositionRevisions', { positionId: 1, version: 0, title: 'Invalid', body: 'Invalid.' })).rejects.toThrow();
  });

  test('only one revision per position can be published', async () => {
    await qi.bulkUpdate('PositionRevisions', { status: 'published' }, { id: 1 });
    await expect(insert('PositionRevisions', { positionId: 1, version: 2, status: 'published', title: 'Second published', body: 'Conflict.' })).rejects.toThrow();
    await qi.bulkUpdate('PositionRevisions', { status: 'superseded' }, { id: 1 });
    await insert('PositionRevisions', { positionId: 1, version: 2, status: 'published', title: 'Second published', body: 'New version.' });
  });

  test('topic links and source fingerprints prevent duplicate entries within their scope', async () => {
    await insert('PositionTopics', { positionId: 1, topicId: 1 });
    await expect(insert('PositionTopics', { positionId: 1, topicId: 1 })).rejects.toThrow();
    const source = { revisionId: 1, provider: 'vouliwatch', sourceUrl: 'https://vouliwatch.gr/policies', retrievedAt: new Date(), contentFingerprint: 'abc' };
    await insert('PositionSources', source);
    await expect(insert('PositionSources', source)).rejects.toThrow();
  });

  test('category seed is repeatable and preserves existing category identities', async () => {
    await categorySeed.up(qi);
    await categorySeed.up(qi);
    const [categories] = await db.query('SELECT id, slug FROM PolicyCategories');
    expect(categories).toHaveLength(12);
    expect(categories.find(category => category.slug === 'housing').id).toBe(1);
  });

  test('rolls back and can be applied again without changing existing tables', async () => {
    await migration.down(qi);
    expect(await qi.showAllTables()).not.toContain('OrganizationPositions');
    await migration.up(qi, Sequelize);
    const [organizations] = await db.query('SELECT id FROM Organizations');
    expect(organizations).toEqual([{ id: 1 }]);
  });
});
