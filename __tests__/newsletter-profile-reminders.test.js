jest.mock('../src/services/mailService', () => ({ sendMail: jest.fn() }));
const { sequelize, User, Location, NewsletterSubscriber, NewsletterSendLog, NewsletterCampaign } = require('../src/models');
const service = require('../src/services/newsletterService');
const { sendMail } = require('../src/services/mailService');
const { updateUserProfile } = require('../src/services/userService');
const migration = require('../src/migrations/20261024000000-newsletter-preferences-and-profile-reminders');
const reviewMigration = require('../src/migrations/20261115000000-newsletter-test-review');
const { FOLLOWUP_TEMPLATES, buildFeaturedPollBlock } = require('../lib/constants/newsletterFollowups');
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
const deliveries = () => sendMail.mock.calls.filter(([mail]) => !mail.subject.startsWith('[TEST]'));
async function sendReviewed(campaign) {
  await service.sendCampaignTestEmail(campaign.id, { email: admin.email });
  return service.sendCampaignNow(campaign.id);
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
  await sendReviewed(campaign);
  expect(deliveries()).toHaveLength(0);
  await subscriber.destroy();
  await updateUserProfile(user.id, { isDiaspora: false });
  expect((await service.getUserNewsletterPreference(user)).subscribed).toBe(false);
});

test('one successful reminder across campaigns, with completion reporting and real CTA', async () => {
  const { user, subscriber } = await account();
  const first = await draft();
  await sendReviewed(first);
  expect(deliveries()).toHaveLength(1);
  expect(deliveries()[0][0].html).toContain('https://appofasi.gr/onboarding?step=location');
  expect(deliveries()[0][0].text).not.toContain('{{onboardingUrl}}');
  expect((await subscriber.reload()).profileReminderSentAt).toBeTruthy();
  const second = await draft();
  await sendReviewed(second);
  expect(deliveries()).toHaveLength(1);
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
  await sendReviewed(second);
  expect(deliveries()).toHaveLength(1);
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

test('a saved campaign cannot send, schedule or be created as scheduled before a successful test', async () => {
  await account();
  const campaign = await draft();
  await expect(service.sendCampaignNow(campaign.id)).rejects.toMatchObject({ status: 409 });
  await expect(service.scheduleCampaign(campaign.id, { scheduledAt: '2027-01-01' })).rejects.toMatchObject({ status: 409 });
  await expect(service.createCampaignDraft({ subject: 'Unsafe', htmlContent: '<p>Body</p>', scheduledAt: '2027-01-01' }, admin.id)).rejects.toMatchObject({ status: 400 });
  expect(sendMail).not.toHaveBeenCalled();
  expect((await campaign.reload()).status).toBe('draft');
  sendMail.mockRejectedValueOnce(new Error('SMTP unavailable'));
  await expect(service.sendCampaignTestEmail(campaign.id, { email: admin.email })).rejects.toThrow('SMTP unavailable');
  expect((await service.getCampaignById(campaign.id)).testReview.current).toBe(false);
  await expect(service.sendCampaignNow(campaign.id)).rejects.toMatchObject({ status: 409 });
});

test('content and audience edits invalidate the test and cancel scheduled delivery', async () => {
  const campaign = await draft();
  await service.sendCampaignTestEmail(campaign.id, { email: admin.email });
  expect((await service.getCampaignById(campaign.id)).testReview).toMatchObject({ current: true, email: admin.email });
  await service.scheduleCampaign(campaign.id, { scheduledAt: '2027-01-01' });
  await service.updateCampaignDraft(campaign.id, { htmlContent: '<p>Revised</p>' });
  expect((await campaign.reload()).status).toBe('draft');
  expect(campaign.scheduledAt).toBeNull();
  await expect(service.sendCampaignNow(campaign.id)).rejects.toMatchObject({ status: 409 });
  await service.sendCampaignTestEmail(campaign.id, { email: admin.email });
  await service.updateCampaignDraft(campaign.id, { audienceFilters: { purpose: 'profile_location', locale: 'en' } });
  expect((await service.getCampaignById(campaign.id)).testReview.current).toBe(false);
  await expect(service.scheduleCampaign(campaign.id, { scheduledAt: '2027-01-01' })).rejects.toMatchObject({ status: 409 });
});

test('test sends leave subscriptions and unsubscribe tokens untouched, including changes during SMTP', async () => {
  const { subscriber } = await account();
  const token = await service.issueUnsubscribeToken(subscriber);
  const tokenHash = subscriber.unsubscribeTokenHash;
  const campaign = await draft();
  sendMail.mockImplementationOnce(async () => {
    await service.updateCampaignDraft(campaign.id, { subject: 'Changed during test delivery' });
    return { messageId: 'test' };
  });
  const result = await service.sendCampaignTestEmail(campaign.id, { email: subscriber.email });
  expect(result.current).toBe(false);
  expect((await service.getCampaignById(campaign.id)).testReview.current).toBe(false);
  expect((await subscriber.reload()).unsubscribeTokenHash).toBe(tokenHash);
  expect(subscriber.profileReminderSentAt).toBeNull();
  expect(subscriber.profileReminderClaimedAt).toBeNull();
  expect(subscriber.status).toBe('subscribed');
  expect(sendMail.mock.calls[0][0].html).not.toContain(token);
  expect(await NewsletterSendLog.count()).toBe(0);
});

test('follow-up templates and poll cards render real links in HTML and text without leaking markup', async () => {
  const poll = { id: 42, title: 'A question <script>alert(1)</script> & answers', status: 'active', visibility: 'public', voteRestriction: 'authenticated' };
  const block = buildFeaturedPollBlock(poll, 'en');
  expect(block.html).toContain('&lt;script&gt;');
  expect(() => buildFeaturedPollBlock({ ...poll, visibility: 'private' })).toThrow();
  expect(() => buildFeaturedPollBlock({ ...poll, voteRestriction: 'locals_only' })).toThrow();
  expect(() => buildFeaturedPollBlock({ ...poll, deadline: '2020-01-01' })).toThrow();
  expect(FOLLOWUP_TEMPLATES).toHaveLength(8);
  for (const template of FOLLOWUP_TEMPLATES) {
    const campaign = await service.createCampaignDraft({ ...template, htmlContent: template.htmlContent + block.html, textContent: template.textContent + block.text }, admin.id);
    await service.sendCampaignTestEmail(campaign.id, { email: admin.email });
    const email = sendMail.mock.calls.at(-1)[0];
    for (const path of ['/polls', '/locations', '/calendar', '/suggestions/new', '/polls/42']) {
      expect(email.html).toContain(`https://appofasi.gr${path}`);
      expect(email.text).toContain(`https://appofasi.gr${path}`);
    }
    expect(email.html).not.toContain('{{');
    expect(email.text).not.toContain('{{');
  }
});

test('review migration preserves a recorded test when applied repeatedly', async () => {
  const campaign = await draft();
  await service.sendCampaignTestEmail(campaign.id, { email: admin.email });
  await reviewMigration.up(sequelize.getQueryInterface(), DataTypes);
  await reviewMigration.up(sequelize.getQueryInterface(), DataTypes);
  expect((await service.getCampaignById(campaign.id)).testReview.current).toBe(true);
});

test('saving a schedule date cannot arm delivery and cancellation preserves the tested content', async () => {
  const campaign = await draft();
  await service.sendCampaignTestEmail(campaign.id, { email: admin.email });
  await service.updateCampaignDraft(campaign.id, { scheduledAt: '2020-01-01' });
  expect((await campaign.reload()).status).toBe('draft');
  expect((await service.processDueScheduledCampaigns()).due).toBe(0);
  await service.scheduleCampaign(campaign.id, { scheduledAt: '2027-01-01' });
  await service.updateCampaignDraft(campaign.id, { scheduledAt: null });
  expect((await campaign.reload()).status).toBe('draft');
  expect(campaign.scheduledAt).toBeNull();
  expect((await service.getCampaignById(campaign.id)).testReview.current).toBe(true);
  expect(deliveries()).toHaveLength(0);
});

test('all email templates can be pinned to one registered user regardless of subscriber locale', async () => {
  const { subscriber: other } = await account();
  for (const template of FOLLOWUP_TEMPLATES) {
    const { user, subscriber } = await account({}, { locale: null, preferences: { general: true, local: true, activity: true } });
    const campaign = await service.createCampaignDraft({ ...template, audienceFilters: { ...template.audienceFilters, recipientMode: 'individual', recipientUserId: user.id } }, admin.id);
    const review = await service.getCampaignById(campaign.id);
    expect(review.estimatedRecipients).toBe(1);
    expect(review.individualRecipient).toMatchObject({ id: user.id, email: user.email });
    expect(review.sampleRecipients).toEqual([subscriber.email]);
    const result = await sendReviewed(campaign);
    expect(result.summary.totalRecipients).toBe(1);
    expect(deliveries().at(-1)[0].to).toBe(subscriber.email);
  }
  expect(deliveries()).toHaveLength(FOLLOWUP_TEMPLATES.length);
  expect(deliveries().some(([mail]) => mail.to === other.email)).toBe(false);
});

test('missing, invalid and deleted individual recipients never fall back to a bulk audience', async () => {
  const { user } = await account();
  await account();
  for (const id of [null, '', 0, -1, 'not-a-user', 1.5, true, []]) {
    await expect(draft({ recipientMode: 'individual', recipientUserId: id })).rejects.toMatchObject({ status: 400 });
  }
  await expect(draft({ recipientUserId: user.id })).rejects.toMatchObject({ status: 400 });
  const campaign = await draft({ recipientMode: 'individual', recipientUserId: user.id });
  await service.sendCampaignTestEmail(campaign.id, { email: admin.email });
  await user.destroy();
  const review = await service.getCampaignById(campaign.id);
  expect(review.estimatedRecipients).toBe(0);
  expect(review.exclusions.recipientUnavailable).toBe(1);
  await service.sendCampaignNow(campaign.id);
  expect(deliveries()).toHaveLength(0);
  expect(await service.getEligibleSubscribers({ recipientMode: 'individual' })).toHaveLength(0);
});

test('individual reminders still exclude unsubscribed, unverified, completed and previously reminded users', async () => {
  const cases = [
    [{}, { status: 'unsubscribed' }, 'unsubscribed'],
    [{ emailVerified: false }, {}, 'unverifiedEmail'],
    [{ homeLocationId: city.id }, {}, 'outsideSegment'],
    [{}, { profileReminderSentAt: new Date() }, 'alreadyReminded'],
    [{}, { preferences: { general: false, local: true, activity: true } }, 'topicOptOut'],
  ];
  for (const [userOverrides, subscriberOverrides, reason] of cases) {
    const { user } = await account(userOverrides, subscriberOverrides);
    const campaign = await draft({ recipientMode: 'individual', recipientUserId: user.id });
    const review = await service.getCampaignById(campaign.id);
    expect(review.estimatedRecipients).toBe(0);
    expect(review.exclusions[reason]).toBe(1);
    await sendReviewed(campaign);
  }
  const { user, subscriber } = await account();
  await subscriber.destroy();
  const campaign = await draft({ recipientMode: 'individual', recipientUserId: user.id });
  expect((await service.getCampaignById(campaign.id)).exclusions.notSubscribed).toBe(1);
  expect(deliveries()).toHaveLength(0);
  expect(await NewsletterSubscriber.findOne({ where: { email: user.email } })).toBeNull();
});

test('changing a selected user invalidates the test; completion after review prevents delivery', async () => {
  const { user: first } = await account();
  const { user: second } = await account();
  const campaign = await draft({ recipientMode: 'individual', recipientUserId: first.id });
  await service.sendCampaignTestEmail(campaign.id, { email: admin.email });
  await service.updateCampaignDraft(campaign.id, { audienceFilters: { purpose: 'profile_location', recipientMode: 'individual', recipientUserId: second.id } });
  expect((await service.getCampaignById(campaign.id)).testReview.current).toBe(false);
  await expect(service.sendCampaignNow(campaign.id)).rejects.toMatchObject({ status: 409 });
  await service.sendCampaignTestEmail(campaign.id, { email: admin.email });
  await second.update({ homeLocationId: city.id });
  await service.sendCampaignNow(campaign.id);
  expect(deliveries()).toHaveLength(0);
});
