/* global document, window */
const { test, expect } = require('@playwright/test');
const en = require('../messages/en.json');
const el = require('../messages/el.json');

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => {
    localStorage.setItem('appofa_country_entry_decision_v1', 'stay');
    localStorage.setItem('gdpr_consent', JSON.stringify({ necessary: true, analytics: false, functional: false }));
  });
});

async function createAccount(page, suffix, messages = en) {
  await page.locator('[name="email"]').fill(`signup-${suffix}-${Date.now()}@example.test`);
  await page.locator('[name="password"]').fill('Password123!');
  await page.locator('[name="gdpr_consent"]').check();
  await page.getByRole('button', { name: messages.auth.submit_register, exact: true }).click();
}

test('signup validates fields, confirms account creation and lets people skip setup', async ({ page }, testInfo) => {
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  await page.goto('/register');
  await expect(page.locator('[name="username"], [name="confirmPassword"], [name="gdpr_marketing"]')).toHaveCount(0);
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await page.getByRole('button', { name: en.auth.submit_register, exact: true }).click();
  await expect(page.locator('[name="email"]')).toBeFocused();
  await expect(page.getByText(en.auth.email_invalid, { exact: true })).toBeVisible();
  await page.locator('[name="email"]').fill(`signup-${Date.now()}@example.test`);
  await page.locator('[name="password"]').fill('short');
  await page.getByRole('button', { name: en.auth.submit_register, exact: true }).click();
  await expect(page.locator('[name="password"]')).toBeFocused();
  await page.getByRole('button', { name: en.auth.show_password, exact: true }).click();
  await expect(page.locator('[name="password"]')).toHaveAttribute('type', 'text');
  await page.screenshot({ path: testInfo.outputPath('signup-form.png'), fullPage: true });
  await createAccount(page, 'skip');
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole('heading', { name: en.signupJourney.account_ready })).toBeVisible();
  await expect(page.getByRole('heading', { name: en.locationOnboarding.title, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: en.signupJourney.verification_title })).toBeVisible();
  await expect(page.getByText(en.signupJourney.verification_later_help, { exact: true })).toBeVisible();
  await expect(page.getByText(en.onboarding.choose_one_primary, { exact: true })).toBeHidden();
  await expect(page.getByRole('heading', { name: en.onboarding.your_checklist })).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: en.locationOnboarding.subscribe })).toBeHidden();
  await expect(page.getByRole('button', { name: en.locationOnboarding.saveLocation, exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: en.locationOnboarding.skip, exact: true })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('signup-ready.png'), fullPage: true });
  await page.getByRole('button', { name: en.locationOnboarding.skip, exact: true }).click();
  await expect(page).toHaveURL(/\/polls$/);
  const onboarding = await (await page.request.get('/api/auth/onboarding')).json();
  expect(onboarding.data.onboarding.onboardingCompletedAt).toBeTruthy();
  expect(browserErrors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('signup can correct an email and save a location in Greek', async ({ page, context }, testInfo) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'el', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/register');
  await createAccount(page, 'correct', el);
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole('heading', { name: el.signupJourney.account_ready, exact: true })).toBeVisible();
  const correctedEmail = `corrected-${Date.now()}@example.test`;
  await page.getByRole('button', { name: el.signupJourney.correct_email, exact: true }).click();
  await page.getByRole('textbox', { name: el.signupJourney.correct_email_label }).fill(correctedEmail);
  await page.getByRole('button', { name: el.signupJourney.save_email, exact: true }).click();
  await expect(page.getByRole('status')).toContainText(el.signupJourney.verification_sent);
  const profile = await (await page.request.get('/api/auth/profile')).json();
  expect(profile.data.user.email).toBe(correctedEmail);
  expect(profile.data.user.emailVerified).toBe(false);
  await expect(page.getByText(el.signupJourney.verification_destination.replace('{email}', correctedEmail))).toBeVisible();
  const labels = el.common.location_selector;
  await expect(page.getByRole('combobox', { name: labels.label_city, exact: true })).toHaveCount(0);
  await page.getByRole('combobox', { name: labels.label_country, exact: true }).selectOption('1');
  await page.getByRole('combobox', { name: labels.label_prefecture, exact: true }).selectOption('2');
  await page.getByRole('combobox', { name: labels.label_city, exact: true }).selectOption('3');
  await expect(page.getByRole('button', { name: el.locationOnboarding.skipSelected, exact: true })).toBeVisible();
  await page.getByRole('button', { name: el.locationOnboarding.saveLocation, exact: true }).click();
  await expect(page).toHaveURL(/\/locations\/3$/);
  await expect(page.getByRole('heading', { name: el.signupJourney.verification_title })).toBeVisible();
  const savedProfile = await (await page.request.get('/api/auth/profile')).json();
  expect(savedProfile.data.user.homeLocationId).toBe(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('signup-local-topics.png'), fullPage: true });
});

test('signup returns people to the action that prompted registration', async ({ page }) => {
  await page.goto('/register?next=%2Fpolls%2F1');
  await createAccount(page, 'return');
  await expect(page).toHaveURL(/\/polls\/1-improve-our-local-park$/);
  await expect(page.getByRole('heading', { name: 'Improve our local park', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: en.signupJourney.verification_title })).toBeVisible();
});

test('signup lets an unverified user change their username', async ({ page }) => {
  await page.goto('/register');
  await createAccount(page, 'rename');
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.goto('/profile');
  const username = page.locator('[name="username"]');
  await expect(username).toHaveValue(/^citizen-/);
  await expect(page.locator('[name="twitchChannel"]')).toHaveCount(0);
  const newUsername = `user_${Date.now()}`;
  await username.fill(newUsername);

  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().endsWith('/api/auth/profile') && res.request().method() === 'PUT'),
    page.getByRole('button', { name: en.profile.save_changes, exact: true }).click(),
  ]);
  expect(response.ok()).toBe(true);
  expect(response.request().postDataJSON()).not.toHaveProperty('twitchChannel');

  await page.reload();
  await expect(username).toHaveValue(newUsername);
});

test('signup profile lets a privileged user edit Twitch', async ({ page }) => {
  const login = await page.request.post('/api/auth/login', {
    data: { email: 'author@example.test', password: 'TestPassword123!' },
  });
  expect(login.ok()).toBe(true);

  await page.goto('/profile');
  const twitchChannel = page.getByRole('textbox', { name: en.profile.twitch_channel, exact: true });
  await expect(twitchChannel).toBeEditable();
  const channel = `channel_${Date.now()}`;
  await twitchChannel.fill(channel);
  await page.getByRole('button', { name: en.profile.save_changes, exact: true }).click();
  await expect(page.getByText(en.profile.updated_successfully, { exact: true })).toBeVisible();

  await page.reload();
  await expect(twitchChannel).toHaveValue(channel);
});
