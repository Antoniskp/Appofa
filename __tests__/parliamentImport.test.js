const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { sequelize, User, Location, CivicQuestion, CivicQuestionVote } = require('../src/models');
const { importParliamentQuestions } = require('../src/scripts/import-parliament-questions');

describe('reviewed Parliament content import', () => {
  let creator;
  let backupDir;
  const data = {
    checkedAt: '2026-10-12T09:00:00Z',
    items: [{ lawId: 'test-law', title: 'New reviewed parliamentary question', sourceStatus: 'In committee', status: 'open' }],
    updates: [{ lawId: 'old-law', matchTitle: 'Existing long official title', updateOnly: true, title: 'Existing shorter title', sourceStatus: 'Passed', status: 'closed' }],
  };

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    creator = await User.create({ username: 'editor', email: 'editor@example.test', password: 'Test1234!', role: 'admin' });
    await Location.create({ name: 'Greece', name_local: 'Ελλάδα', slug: 'greece', code: 'GR', type: 'country' });
    backupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parliament-import-'));
  });
  afterAll(async () => {
    await sequelize.close();
    fs.rmSync(backupDir, { recursive: true, force: true });
  });

  test('dry run is read-only; applying preserves votes, backs up content, and is repeat-safe', async () => {
    const old = await CivicQuestion.create({ title: 'Existing long official title', sourceType: 'parliament', creatorId: creator.id });
    await CivicQuestionVote.create({ civicQuestionId: old.id, userId: creator.id, choice: 'agree' });
    const dry = await importParliamentQuestions({ creatorId: creator.id, data });
    expect(dry.map(a => a.action)).toEqual(['create', 'update']);
    expect(await CivicQuestion.count()).toBe(1);
    const backup = path.join(backupDir, 'before.json');
    await importParliamentQuestions({ creatorId: creator.id, data, apply: true, backupPath: backup });
    expect(JSON.parse(fs.readFileSync(backup)).questions[0].title).toBe('Existing long official title');
    expect(await CivicQuestion.count()).toBe(2);
    expect((await old.reload()).status).toBe('closed');
    expect(await CivicQuestionVote.count({ where: { civicQuestionId: old.id } })).toBe(1);
    const again = await importParliamentQuestions({ creatorId: creator.id, data, apply: true, backupPath: path.join(backupDir, 'again.json') });
    expect(again.every(a => a.action === 'skip-reviewed')).toBe(true);
    expect(await CivicQuestion.count()).toBe(2);
  });

  test('refuses to overwrite a backup and leaves the database unchanged', async () => {
    await expect(importParliamentQuestions({ creatorId: creator.id, data, apply: true, backupPath: path.join(backupDir, 'before.json') })).rejects.toThrow();
    expect(await CivicQuestion.count()).toBe(2);
  });
});
