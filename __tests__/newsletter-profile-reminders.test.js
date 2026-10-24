jest.mock('../src/services/mailService', () => ({ sendMail: jest.fn() }));
const { sequelize, User, Location, NewsletterSubscriber, NewsletterSendLog, NewsletterCampaign } = require('../src/models');
const service = require('../src/services/newsletterService');
const { sendMail } = require('../src/services/mailService');
const { updateUserProfile } = require('../src/services/userService');
const migration = require('../src/migrations/20261024000000-newsletter-preferences-and-profile-reminders');
const { DataTypes } = require('sequelize');

let admin;
let city;
let serial = 0;
async function account(overrides = {}, subscriberOverrides = {}) {
  serial += 1;
  const user = await User.create({ username: `member${serial}`, email: `member${serial}@test.com`, emailVerified: true, ...overrides });
  const subscriber = await NewsletterSubscriber.create({ email: user.email, status: 'subscribed', ...subscriberOverrides });
  return { user, subscriber };
}
async function draft(filters = {}) {
  return service.createCampaignDraft({ subject: 'Choose your area', htmlContent: '<a href="{{onboardingUrl}}">Complete your profile</a>', textContent: '{{onboardingUrl}}', audienceFilters: { purpose: 'profile_location', ...filters } }, admin.id);
}

beforeAll(async () => {
  process.env.FRONTEND_URL = 'https://appofasi.gr';
  process.env.NEWSLETTER_BATCH_DELAY_MS = '0';
  await sequelize.sync({ force: true });
  admin = await User.create({ username: 'admin', email: 'admin@test.com', role: 'admin' });
  city = await Location.create({ name: 'Test city', slug: 'test-city', type: 'municipality' });
});
beforeEach(async () => {
  sendMail.mockReset().mockResolvedValue({ messageId: 'mock' });
  await NewsletterSendLog.destroy({ where: {} });
  await NewsletterCampaign.destroy({ where: {} });
  await NewsletterSubscriber.destroy({ where: {} });
});
afterAll(() => sequelize.close());

test('reminder preview excludes completed, unverified, opted-out, non-account and previously reminded addresses', async () => {
  const { subscriber } = await account();
  await account({ homeLocationId: city.id });
  await account({ emailVerified: false });
  await account({}, { status: 'unsubscribed' });
  await account({}, { profileReminderSentAt: new Date() });
  await account({}, { preferences: { general: false, local: true, activity: false } });
  await NewsletterSubscriber.create({ email: 'no-account@test.com' });
  const campaign = await draft();
  const review = await service.getCampaignById(campaign.id);
  expect(review.estimatedRecipients).toBe(1);
  expect(review.sampleRecipients).toEqual([subscriber.email]);
  expect(review.exclusions).toMatchObject({ outsideSegment: 2, unverifiedEmail: 1, unsubscribed: 1, alreadyReminded: 1, topicOptOut: 1 });
  expect(review.previewHtml).toContain('https://appofasi.gr/onboarding?step=location');
  expect(sendMail).not.toHaveBeenCalled();
});

test('completion after preview removes recipient and saving location does not subscribe the account', async () => {
  const { user, subscriber } = await account();
  const campaign = await draft();
  expect((await service.getCampaignById(campaign.id)).estimatedRecipients).toBe(1);
  await updateUserProfile(user.id, { homeLocationId: city.id, isDiaspora: true });
  expect((await User.findByPk(user.id)).isDiaspora).toBe(true);
  await service.sendCampaignNow(campaign.id);
  expect(sendMail).not.toHaveBeenCalled();
  await subscriber.destroy();
  await updateUserProfile(user.id, { isDiaspora: false });
  expect((await service.getUserNewsletterPreference(user)).subscribed).toBe(false);
});

test('one successful reminder across campaigns, with completion reporting and real CTA', async () => {
  const { user, subscriber } = await account();
  const first = await draft();
  await service.sendCampaignNow(first.id);
  expect(sendMail).toHaveBeenCalledTimes(1);
  expect(sendMail.mock.calls[0][0].html).toContain('https://appofasi.gr/onboarding?step=location');
  expect(sendMail.mock.calls[0][0].text).not.toContain('{{onboardingUrl}}');
  expect((await subscriber.reload()).profileReminderSentAt).toBeTruthy();
  const second = await draft();
  await service.sendCampaignNow(second.id);
  expect(sendMail).toHaveBeenCalledTimes(1);
  await user.update({ homeLocationId: city.id });
  expect((await service.getCampaignById(first.id)).completedProfiles).toBe(1);
});

test('preference topics are validated and enforced; status cannot bypass consent', async () => {
  const { user } = await account();
  await expect(service.updateUserNewsletterPreference(user, { subscribed: true, preferences: { general: 'yes' } })).rejects.toMatchObject({ status: 400 });
  await service.updateUserNewsletterPreference(user, { subscribed: true, locale: 'el', preferences: { general: false, local: true, activity: false } });
  expect(await service.getEligibleSubscribers({ topic: 'general' })).toHaveLength(0);
  expect(await service.getEligibleSubscribers({ topic: 'local' })).toHaveLength(1);
  await service.updateUserNewsletterPreference(user, { subscribed: false });
  expect(await service.getEligibleSubscribers({ status: 'unsubscribed', topic: 'local' })).toHaveLength(0);
  await expect(draft({ status: 'unsubscribed' })).rejects.toMatchObject({ status: 400 });
});

test('test sends do not mark reminders and failed reminder deliveries are held against duplicate retries', async () => {
  const { subscriber } = await account();
  const first = await draft();
  await service.sendCampaignTestEmail(first.id, { email: 'preview@test.com' });
  expect((await subscriber.reload()).profileReminderSentAt).toBeNull();
  sendMail.mockRejectedValueOnce(new Error('Delivery uncertain'));
  await service.sendCampaignNow(first.id);
  expect((await subscriber.reload()).profileReminderClaimedAt).toBeTruthy();
  expect(subscriber.profileReminderSentAt).toBeNull();
  const second = await draft();
  expect((await service.getCampaignById(second.id)).exclusions.reminderInProgress).toBe(1);
  await service.sendCampaignNow(second.id);
  expect(sendMail).toHaveBeenCalledTimes(2);
});

test('location targeting includes descendants and excludes other locations', async () => {
  const child = await Location.create({ name: 'Test area', slug: 'test-area', type: 'municipality', parent_id: city.id });
  await account({ homeLocationId: city.id });
  await account({ homeLocationId: child.id });
  await account();
  expect(await service.getEligibleSubscribers({ locationId: city.id })).toHaveLength(2);
  expect((await service.listSubscribers({ segment: 'with_location' })).pagination.total).toBe(2);
});

test('migration can be applied repeatedly without data loss', async () => {
  const { subscriber } = await account({}, { preferences: { general: false, local: true, activity: false } });
  const qi = sequelize.getQueryInterface();
  await migration.up(qi, DataTypes);
  await migration.up(qi, DataTypes);
  expect((await subscriber.reload()).preferences.local).toBe(true);
});
