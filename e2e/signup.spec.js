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

// The location page swaps the numeric id for its slug as soon as it loads,
// so either address means the user landed on their home location.
const HOME_LOCATION_URL = /\/locations\/(3|test-municipality)$/;

test('signup validates fields, confirms account creation and skips to the homepage', async ({ page }, testInfo) => {
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
  await expect(page.locator('a[href="/onboarding?mode=advanced"]')).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: en.locationOnboarding.subscribe })).toHaveCount(0);
  await expect(page.getByRole('button', { name: en.locationOnboarding.saveLocation, exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: en.locationOnboarding.skip, exact: true })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('signup-ready.png'), fullPage: true });
  await page.getByRole('button', { name: en.locationOnboarding.skip, exact: true }).click();
  await expect(page).toHaveURL(new URL('/', page.url()).href);
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
  await expect(page).toHaveURL(HOME_LOCATION_URL);
  await expect(page.getByRole('heading', { name: el.signupJourney.verification_title })).toBeVisible();
  const savedProfile = await (await page.request.get('/api/auth/profile')).json();
  expect(savedProfile.data.user.homeLocationId).toBe(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('signup-local-topics.png'), fullPage: true });

  await page.goto('/onboarding?mode=advanced');
  await expect(page.getByRole('heading', { name: el.locationOnboarding.title, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: el.onboarding.choose_one_primary, exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: el.locationOnboarding.continueSaved, exact: true }).click();
  await expect(page).toHaveURL(HOME_LOCATION_URL);
});

test('signup returns people to the action that prompted registration', async ({ page }) => {
  await page.goto('/register?next=%2Fpolls%2F1');
  await createAccount(page, 'return');
  await expect(page).toHaveURL(/\/polls\/1-improve-our-local-park$/);
  await expect(page.getByRole('heading', { name: 'Improve our local park', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: en.signupJourney.verification_title })).toBeVisible();
});

test('founding initiative signup returns to the signing interest form', async ({ page, context }) => {
  const founding = el.foundingInitiative;
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'el', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/founding-initiative');

  const join = page.getByRole('link', { name: founding.joinAction, exact: true });
  await expect(join).toHaveAccessibleDescription(founding.joinNote);
  const documents = founding.documents;
  await page.getByRole('link', { name: documents.heroAction, exact: true }).click();
  await expect(page).toHaveURL(/\/founding-initiative#proclamation$/);
  const review = page.getByRole('region', { name: documents.title, exact: true });
  const currentDocuments = [
    ['proclamation', 1, 'founding-proclamation-v1.el.pdf'],
    ['statement', 1, 'founding-statement-v1.el.pdf'],
    ['statute', 2, 'party-statute-v2.el.pdf'],
  ];
  for (const [key, version, filename] of currentDocuments) {
    const name = documents.pdfLabel.replace('{title}', documents[key].title);
    const heading = page.getByRole('heading', { name: documents[key].title, exact: true });
    const card = review.getByRole('listitem').filter({ has: heading });
    await expect(card.getByText(documents.version.replace('{number}', String(version)))).toBeVisible();
    const href = `/documents/founding-initiative/${filename}`;
    await expect(card.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
    const pdf = await page.request.get(href);
    expect(pdf.ok()).toBe(true);
    expect(pdf.headers()['content-type']).toContain('application/pdf');
    expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
  }
  const proclamationCard = review.getByRole('listitem').filter({ has: page.getByRole('heading', { name: documents.proclamation.title, exact: true }) });
  await proclamationCard.getByText(documents.history, { exact: true }).click();
  await expect(review.getByRole('link', { name: documents.olderDraft, exact: true })).toHaveAttribute('href', '/documents/founding-proclamation-review.el.pdf');
  const statuteCard = review.getByRole('listitem').filter({ has: page.getByRole('heading', { name: documents.statute.title, exact: true }) });
  await statuteCard.getByText(documents.history, { exact: true }).click();
  await expect(statuteCard.getByRole('link', { name: documents.versionPdf.replace('{number}', '1'), exact: true })).toHaveAttribute('href', '/documents/founding-initiative/party-statute-v1.el.pdf');
  await review.getByRole('link', { name: documents.feedbackAction, exact: true }).click();
  await expect(page).toHaveURL(/\/contact#contact-form$/);
  await expect(page.locator('#contact-form [name="subject"]')).toBeVisible();
  await page.goto('/founding-initiative');

  await join.click();
  await expect(page).toHaveURL(/\/founding-initiative#get-involved$/);
  await page.getByRole('link', { name: founding.createAccount, exact: true }).click();
  await createAccount(page, 'founding', el);
  await expect(page).toHaveURL(/\/founding-initiative#get-involved$/);

  const form = page.getByRole('group', { name: founding.chooseInvolvement, exact: true });
  const submit = form.getByRole('button', { name: founding.submitInterest, exact: true });
  await form.getByRole('checkbox', { name: founding.wantToSign, exact: true }).check();
  await expect(submit).toBeDisabled();
  await form.getByRole('checkbox', { name: founding.consent, exact: true }).check();
  await submit.click();
  await expect(page.getByText(founding.interestSaved, { exact: true })).toBeVisible();

  const progress = page.getByRole('region', { name: founding.signatures.signingInterestTitle, exact: true });
  await expect(progress.getByRole('status')).toHaveText('1 άτομο έχει δηλώσει ενδιαφέρον για υπογραφή');
  await form.getByRole('button', { name: founding.withdrawInterest, exact: true }).click();
  await expect(page.getByText(founding.interestWithdrawn, { exact: true })).toBeVisible();
  await expect(progress.getByRole('status')).toHaveText('0 άτομα έχουν δηλώσει ενδιαφέρον για υπογραφή');
});

test('signup opens a saved checklist without asking users to choose a role', async ({ page }) => {
  await page.goto('/register');
  await createAccount(page, 'saved-checklist');
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.route('**/api/auth/onboarding', route => {
    if (route.request().method() !== 'GET') return route.continue();
    return route.fulfill({ json: { success: true, data: { onboarding: {
      onboardingGoal: 'independent',
      emailVerified: true,
      firstNameNative: 'Test',
      lastNameNative: 'User',
      avatar: '/test-avatar.png',
      homeLocationId: 3,
      nationality: 'GR',
      bio: 'Test profile',
    } } } });
  });
  await page.route('**/api/candidate-registrations/mine?*', route =>
    route.fulfill({ json: { success: true, data: { registrations: [{ id: 1 }] } } }));

  await page.goto('/onboarding?mode=advanced');
  await expect(page.getByRole('heading', { name: en.onboarding.your_checklist })).toBeVisible();
  await expect(page.getByRole('heading', { name: en.onboarding.choose_one_primary })).toHaveCount(0);
  await expect(page.getByText(en.onboarding.step_person_search, { exact: true })).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await page.getByRole('link', { name: en.onboarding.explore_platform, exact: true }).click();
  await expect(page).toHaveURL(HOME_LOCATION_URL);
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
