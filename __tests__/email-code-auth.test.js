const request = require('supertest');
const express = require('express');

jest.mock('../src/services/mailService', () => ({ sendMail: jest.fn().mockResolvedValue({ messageId: 'test' }) }));

const { sendMail } = require('../src/services/mailService');
const authRoutes = require('../src/routes/authRoutes');
const pollRoutes = require('../src/routes/pollRoutes');
const { sequelize, User, Poll, PollOption, PollVote, EmailLoginCode } = require('../src/models');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);

const lastCode = () => sendMail.mock.calls.at(-1)[0].subject.match(/(\d{6})$/)[1];
const requestCode = (email, extra = {}) => request(app).post('/api/auth/email-code/request').send({ email, locale: 'el', ...extra });
const verifyCode = (email, code, cookies = []) => request(app)
  .post('/api/auth/email-code/verify')
  .set('Cookie', cookies)
  .send({ email, code, locale: 'el' });
const cookieValue = (res, name) => (res.headers['set-cookie'] || [])
  .map((cookie) => cookie.split(';')[0])
  .find((cookie) => cookie.startsWith(`${name}=`) && cookie.length > name.length + 1);
const wrongCodeFor = (code) => String((Number(code) + 1) % 1000000).padStart(6, '0');

const createPoll = async (voteRestriction = 'anyone') => {
  const creator = await User.create({ username: `creator-${voteRestriction}-${Date.now()}`, email: `creator-${voteRestriction}-${Date.now()}@example.com`, password: 'Password123!', role: 'editor' });
  const poll = await Poll.create({ title: `Poll for ${voteRestriction} voters`, creatorId: creator.id, voteRestriction });
  const options = await PollOption.bulkCreate([
    { pollId: poll.id, text: 'Ναι', order: 0 },
    { pollId: poll.id, text: 'Όχι', order: 1 },
  ]);
  return { poll, options };
};

beforeEach(async () => {
  await sequelize.sync({ force: true });
  sendMail.mockReset().mockResolvedValue({ messageId: 'test' });
});
afterAll(async () => sequelize.close());

describe('email code sign-in', () => {
  test('creates a verified account for a new address and signs in', async () => {
    const sent = await requestCode('New.Person@Example.com');
    expect(sent.status).toBe(200);
    expect(sent.body.data.cooldownSeconds).toBe(60);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].to).toBe('new.person@example.com');
    expect(sendMail.mock.calls[0][0].subject).toMatch(/^Ο κωδικός σου για το Appofasi: \d{6}$/);

    const stored = await EmailLoginCode.findOne({ where: { email: 'new.person@example.com' } });
    expect(stored.codeHash).not.toContain(lastCode());

    const res = await verifyCode('new.person@example.com', lastCode());
    expect(res.status).toBe(201);
    expect(res.body.data.isNewUser).toBe(true);
    expect(cookieValue(res, 'auth_token')).toBeTruthy();
    expect(cookieValue(res, 'csrf_token')).toBeTruthy();

    const user = await User.findOne({ where: { email: 'new.person@example.com' } });
    expect(user.emailVerified).toBe(true);
    expect(user.password).toBeNull();
    expect(user.username).toMatch(/^citizen-[a-f0-9]{24}$/);
  });

  test('signs in an existing verified account without creating another or touching its password', async () => {
    const existing = await User.create({ username: 'existing', email: 'existing@example.com', password: 'Password123!', emailVerified: true });
    await requestCode('existing@example.com');
    const res = await verifyCode('EXISTING@example.com', lastCode());
    expect(res.status).toBe(200);
    expect(res.body.data.isNewUser).toBe(false);
    expect(res.body.data.user.id).toBe(existing.id);
    await existing.reload();
    expect(await existing.comparePassword('Password123!')).toBe(true);
    expect(await User.count()).toBe(1);
  });

  test('verifies an unverified signup and removes the password its unproven creator set', async () => {
    const squatted = await User.create({ username: 'squatted', email: 'owner@example.com', password: 'Password123!', emailVerified: false });
    const oldSessionVersion = squatted.sessionVersion;
    await requestCode('owner@example.com');
    const res = await verifyCode('owner@example.com', lastCode());
    expect(res.status).toBe(200);
    await squatted.reload();
    expect(squatted.emailVerified).toBe(true);
    expect(squatted.password).toBeNull();
    expect(squatted.sessionVersion).not.toBe(oldSessionVersion);
    expect(await squatted.comparePassword('Password123!')).toBe(false);
  });

  test('a code works once', async () => {
    await requestCode('once@example.com');
    const code = lastCode();
    expect((await verifyCode('once@example.com', code)).status).toBe(201);
    const second = await verifyCode('once@example.com', code);
    expect(second.status).toBe(400);
    expect(second.body.code).toBe('EMAIL_CODE_INVALID');
  });

  test('locks a code after five wrong attempts', async () => {
    await requestCode('guess@example.com');
    const code = lastCode();
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const res = await verifyCode('guess@example.com', wrongCodeFor(code));
      expect(res.body.code).toBe('EMAIL_CODE_INVALID');
    }
    const fifth = await verifyCode('guess@example.com', wrongCodeFor(code));
    expect(fifth.body.code).toBe('EMAIL_CODE_TOO_MANY_ATTEMPTS');
    const correct = await verifyCode('guess@example.com', code);
    expect(correct.status).toBe(400);
    expect(correct.body.code).toBe('EMAIL_CODE_TOO_MANY_ATTEMPTS');
  });

  test('rejects an expired code', async () => {
    await requestCode('late@example.com');
    await EmailLoginCode.update({ expiresAt: new Date(Date.now() - 1000) }, { where: { email: 'late@example.com' } });
    const res = await verifyCode('late@example.com', lastCode());
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('EMAIL_CODE_EXPIRED');
  });

  test('waits a minute between codes and a new code replaces the old one', async () => {
    await requestCode('again@example.com');
    const first = lastCode();
    const tooSoon = await requestCode('again@example.com');
    expect(tooSoon.status).toBe(429);
    expect(tooSoon.body.code).toBe('EMAIL_CODE_COOLDOWN');
    expect(tooSoon.body.retryAfter).toBeGreaterThan(0);
    expect(sendMail).toHaveBeenCalledTimes(1);

    await EmailLoginCode.update({ createdAt: new Date(Date.now() - 2 * 60 * 1000) }, { where: { email: 'again@example.com' }, silent: true });
    expect((await requestCode('again@example.com')).status).toBe(200);
    const second = lastCode();
    if (second !== first) {
      expect((await verifyCode('again@example.com', first)).status).toBe(400);
    }
    expect((await verifyCode('again@example.com', second)).status).toBe(201);
  });

  test('reports a failed email instead of claiming the code was sent', async () => {
    sendMail.mockRejectedValueOnce(new Error('mail offline'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await requestCode('offline@example.com');
    log.mockRestore();
    expect(res.status).toBe(503);
    expect(await EmailLoginCode.count({ where: { email: 'offline@example.com' } })).toBe(0);
  });

  test('rejects an invalid address', async () => {
    const res = await requestCode('not-an-email');
    expect(res.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe('guest votes move to the account at sign-in', () => {
  test('a vote cast before signing in is kept on the new account', async () => {
    const { poll, options } = await createPoll('anyone');
    const vote = await request(app).post(`/api/polls/${poll.id}/vote`).set('User-Agent', 'jest-guest').send({ optionId: options[0].id });
    expect(vote.status).toBe(200);
    const guestCookie = cookieValue(vote, 'guest_voter');
    expect(guestCookie).toBeTruthy();

    await requestCode('voter@example.com');
    const res = await verifyCode('voter@example.com', lastCode(), [guestCookie]);
    expect(res.status).toBe(201);
    expect(res.body.data.claimedVotes).toBe(1);

    const user = await User.findOne({ where: { email: 'voter@example.com' } });
    const votes = await PollVote.findAll({ where: { pollId: poll.id } });
    expect(votes).toHaveLength(1);
    expect(votes[0]).toMatchObject({ userId: user.id, isAuthenticated: true, optionId: options[0].id, sessionId: null });
  });

  test('an earlier account vote wins over the guest vote so nobody is counted twice', async () => {
    const { poll, options } = await createPoll('anyone');
    const user = await User.create({ username: 'voted-before', email: 'voted@example.com', password: 'Password123!', emailVerified: true });
    await PollVote.create({ pollId: poll.id, optionId: options[1].id, userId: user.id, isAuthenticated: true });
    const vote = await request(app).post(`/api/polls/${poll.id}/vote`).set('User-Agent', 'jest-guest-2').send({ optionId: options[0].id });
    const guestCookie = cookieValue(vote, 'guest_voter');

    await requestCode('voted@example.com');
    const res = await verifyCode('voted@example.com', lastCode(), [guestCookie]);
    expect(res.body.data.claimedVotes).toBe(0);
    const votes = await PollVote.findAll({ where: { pollId: poll.id } });
    expect(votes).toHaveLength(1);
    expect(votes[0]).toMatchObject({ userId: user.id, optionId: options[1].id });
  });

  test('guests still cannot vote on polls that need an account', async () => {
    const { poll, options } = await createPoll('authenticated');
    const vote = await request(app).post(`/api/polls/${poll.id}/vote`).send({ optionId: options[0].id });
    expect(vote.status).toBe(401);
    expect(await PollVote.count()).toBe(0);
  });

  test('password sign-in also claims guest votes', async () => {
    const { poll, options } = await createPoll('anyone');
    await User.create({ username: 'pw-user', email: 'pw@example.com', password: 'Password123!', emailVerified: true });
    const vote = await request(app).post(`/api/polls/${poll.id}/vote`).set('User-Agent', 'jest-guest-3').send({ optionId: options[0].id });
    const guestCookie = cookieValue(vote, 'guest_voter');
    const login = await request(app).post('/api/auth/login').set('Cookie', [guestCookie]).send({ email: 'pw@example.com', password: 'Password123!' });
    expect(login.status).toBe(200);
    const stored = await PollVote.findOne({ where: { pollId: poll.id } });
    expect(stored.isAuthenticated).toBe(true);
  });

  test('password sign-in to an account without a password is refused, not an error', async () => {
    await User.create({ username: 'code-only', email: 'codeonly@example.com', password: null, emailVerified: true });
    const login = await request(app).post('/api/auth/login').send({ email: 'codeonly@example.com', password: 'whatever123' });
    expect(login.status).toBe(401);
  });
});
