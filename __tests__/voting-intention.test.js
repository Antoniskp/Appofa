const { sequelize, User, Organization, Poll, PollOption, PollVote, HomepageSettings } = require('../src/models');
const intention = require('../src/services/votingIntentionService');
const polls = require('../src/services/pollService');

describe('Voting intention on the existing poll system', () => {
  let admin, voter, other, parties, poll, options;
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    admin = await User.create({ username: 'polladmin', email: 'admin@poll.test', role: 'admin' });
    voter = await User.create({ username: 'voter', email: 'voter@poll.test', googleId: 'google-account-one' });
    other = await User.create({ username: 'other', email: 'other@poll.test' });
    parties = await Organization.bulkCreate([
      { name: 'Party A', slug: 'party-a', type: 'party', createdByUserId: admin.id },
      { name: 'Party B', slug: 'party-b', type: 'party', createdByUserId: admin.id }
    ]);
  });
  afterAll(async () => { await sequelize.close(); });

  test('only admins can create a round; invalid and duplicate parties are rejected', async () => {
    expect((await intention.create(voter, { partyIds: parties.map(p => p.id) })).status).toBe(403);
    expect((await intention.create(admin, { partyIds: [parties[0].id, parties[0].id] })).status).toBe(400);
    expect((await intention.create(admin, { partyIds: [parties[0].id, 9999] })).status).toBe(400);
    expect((await intention.create(admin, { partyIds: parties.map(p => p.id), deadline: 'invalid' })).status).toBe(400);
    expect(await Poll.count()).toBe(0);
  });

  test('creates party snapshots and neutral options, and activates the homepage entry', async () => {
    const result = await intention.create(admin, { partyIds: parties.map(p => p.id) });
    expect(result.success).toBe(true);
    poll = await Poll.findByPk(result.data.id);
    options = await PollOption.findAll({ where: { pollId: poll.id }, order: [['order', 'ASC']] });
    expect(options.map(o => o.text)).toEqual(['Party A', 'Party B', 'Άλλο κόμμα', 'Δεν έχω αποφασίσει', 'Λευκό / Άκυρο', 'Αποχή']);
    expect(poll.voteRestriction).toBe('authenticated');
    expect(poll.allowUserContributions).toBe(false);
    expect((await HomepageSettings.findOne()).featuredPoll.pollId).toBe(poll.id);
    await parties[0].update({ name: 'Changed party name' });
    expect((await options[0].reload()).text).toBe('Party A');
  });

  const vote = (user, option = options[0]) => polls.votePoll(poll.id, option.id, user?.id, user?.role, '127.0.0.1', 'test', 'public');

  test('rejects guests and accounts without Google, including admins', async () => {
    expect((await vote(null)).success).toBe(false);
    expect((await vote(other)).status).toBe(403);
    expect((await vote(admin)).status).toBe(403);
    expect(await PollVote.count()).toBe(0);
  });

  test('forces hidden identity and replaces a choice without adding a vote', async () => {
    expect((await vote(voter)).success).toBe(true);
    expect((await vote(voter, options[1])).success).toBe(true);
    expect(await PollVote.count()).toBe(1);
    const stored = await PollVote.findOne();
    expect(stored.optionId).toBe(options[1].id);
    expect(stored.identityVisibility).toBe('anonymous');
    expect(stored.voterKey).toHaveLength(64);
    const detail = await polls.getPollById(poll.id, voter);
    expect(detail.data.googleVotingEligible).toBe(true);
    expect(detail.data.options[1].publicVoters).toEqual([]);
    expect(JSON.stringify(detail)).not.toContain(stored.voterKey);
  });

  test('cannot weaken participation rules or change a ballot after voting', async () => {
    expect((await polls.updatePoll(poll.id, admin.id, 'admin', { voteRestriction: 'anyone' })).status).toBe(400);
    expect((await polls.updatePoll(poll.id, admin.id, 'admin', { options: [{ text: 'replacement' }] })).status).toBe(400);
    expect((await polls.updatePoll(poll.id, admin.id, 'admin', { status: 'closed' })).success).toBe(true);
    expect((await polls.updatePoll(poll.id, admin.id, 'admin', { status: 'active' })).success).toBe(true);
  });

  test('relinking a Google account to another local account cannot duplicate or expose its vote', async () => {
    await voter.update({ googleId: null });
    await other.update({ googleId: 'google-account-one' });
    expect((await vote(other)).status).toBe(409);
    const detail = await polls.getPollById(poll.id, other);
    expect(detail.data.userVote).toBeUndefined();
    await voter.update({ googleId: 'google-account-two' });
    expect((await vote(voter)).status).toBe(409);
    expect(await PollVote.count()).toBe(1);
  });

  test('database rejects duplicate Google keys even if application checks are bypassed', async () => {
    const existing = await PollVote.findOne();
    await expect(PollVote.create({ pollId: poll.id, optionId: options[0].id, userId: other.id, isAuthenticated: true, voterKey: existing.voterKey })).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  });

  test('closed or disabled rounds disappear from onboarding', async () => {
    expect((await intention.getCurrent(null)).data.id).toBe(poll.id);
    await poll.update({ status: 'closed' });
    expect((await intention.getCurrent(null)).data).toBeNull();
    expect((await vote(other)).success).toBe(false);
    await poll.update({ status: 'active' });
    await (await HomepageSettings.findOne()).update({ featuredPoll: { enabled: false, pollId: poll.id } });
    expect((await intention.getCurrent(null)).data).toBeNull();
  });
});
