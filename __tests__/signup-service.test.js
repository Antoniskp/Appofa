jest.mock('../src/services/mailService', () => ({ sendMail: jest.fn().mockResolvedValue({ messageId: 'test' }) }));
const { sequelize, User } = require('../src/models');
const authService = require('../src/services/authService');
const { updateUserProfile } = require('../src/services/userService');
const { sendMail } = require('../src/services/mailService');

const register = (email = 'private.name@example.com') => authService.registerUser({ email, password: 'Password123!', locale: 'en' });
const lastToken = () => sendMail.mock.calls.at(-1)[0].text.match(/verify-email\?token=([a-f0-9]+)/)[1];

beforeEach(async () => {
  await sequelize.sync({ force: true });
  sendMail.mockReset().mockResolvedValue({ messageId: 'test' });
});
afterAll(async () => sequelize.close());

test('creates a unique editable handle without disclosing any part of the email', async () => {
  const first = await register();
  const second = await register('another@example.com');
  expect(first.user.username).toMatch(/^citizen-[a-f0-9]{24}$/);
  expect(first.user.username).not.toBe(second.user.username);
  expect(first.user.username).not.toContain('private');
  expect(first.user.emailVerified).toBe(false);
  expect(first.user.newsletterOptIn).toBeFalsy();
});

test('saves an unverified account username when the submitted Twitch field is empty', async () => {
  const { user } = await register();
  await updateUserProfile(user.id, { username: 'new_username', twitchChannel: '' });
  await user.reload();
  expect(user).toMatchObject({ username: 'new_username', twitchChannel: null });
});

test('allows an unchanged Twitch channel and restricts actual edits', async () => {
  const { user } = await register();
  await expect(updateUserProfile(user.id, { twitchChannel: 'my_channel' })).rejects.toMatchObject({ status: 403 });

  await user.update({ isVerified: true });
  await updateUserProfile(user.id, { twitchChannel: 'my_channel' });
  await user.update({ isVerified: false });

  await updateUserProfile(user.id, { username: 'another_username', twitchChannel: 'my_channel' });
  await expect(updateUserProfile(user.id, { twitchChannel: '' })).rejects.toMatchObject({ status: 403 });
  await user.reload();
  expect(user).toMatchObject({ username: 'another_username', twitchChannel: 'my_channel' });
});

test('corrects an unverified address, invalidates the old link, and verifies only the new address', async () => {
  const { user } = await register();
  const oldToken = lastToken();
  await authService.resendVerificationEmail(user.id, 'correct@example.com');
  const newToken = lastToken();
  await expect(authService.verifyEmailWithToken(oldToken)).rejects.toMatchObject({ code: 'EMAIL_VERIF_TOKEN_INVALID' });
  await user.reload();
  expect(user.email).toBe('correct@example.com');
  expect(user.emailVerified).toBe(false);
  expect(sendMail.mock.calls.at(-1)[0].to).toBe('correct@example.com');
  await authService.verifyEmailWithToken(newToken);
  await user.reload();
  expect(user.emailVerified).toBe(true);
});

test('does not change a verified account or claim another account email', async () => {
  const { user } = await register();
  await register('used@example.com');
  await expect(authService.resendVerificationEmail(user.id, 'used@example.com')).rejects.toMatchObject({ status: 400 });
  await user.update({ emailVerified: true });
  await expect(authService.resendVerificationEmail(user.id, 'new@example.com')).rejects.toMatchObject({ status: 400 });
  await user.reload();
  expect(user.email).toBe('private.name@example.com');
});

test('does not correct an OAuth account address', async () => {
  const user = await User.create({ username: 'oauth-user', email: 'oauth@example.com', googleId: 'google-test', password: null });
  await expect(authService.resendVerificationEmail(user.id, 'other@example.com')).rejects.toMatchObject({ status: 400 });
});

test('reports mail delivery failure instead of claiming that a message was sent', async () => {
  const { user } = await register();
  sendMail.mockRejectedValueOnce(new Error('mail offline'));
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await expect(authService.resendVerificationEmail(user.id)).rejects.toMatchObject({ status: 503 });
  } finally { log.mockRestore(); }
});

test('does not verify a stale token if the address changes after the token was read', async () => {
  const { user } = await register();
  const oldToken = lastToken();
  const originalUpdate = User.update.bind(User);
  const update = jest.spyOn(User, 'update').mockImplementationOnce(async (...args) => {
    await originalUpdate({ email: 'corrected@example.com', emailVerifToken: 'new-token' }, { where: { id: user.id } });
    return originalUpdate(...args);
  });
  try {
    await expect(authService.verifyEmailWithToken(oldToken)).rejects.toMatchObject({ code: 'EMAIL_VERIF_TOKEN_INVALID' });
    await user.reload();
    expect(user.emailVerified).toBe(false);
  } finally { update.mockRestore(); }
});
