const { test, expect } = require('@playwright/test');
const en = require('../messages/en.json');

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => {
    localStorage.setItem('appofa_country_entry_decision_v1', 'stay');
  });
});

for (const locale of ['el', 'en', 'ro']) {
  test(`homepage action controls use the ${locale} locale`, async ({ page, context }) => {
    const messages = require(`../messages/${locale}.json`);
    await context.addCookies([{ name: 'NEXT_LOCALE', value: locale, domain: '127.0.0.1', path: '/' }]);
    await page.goto('/');
    const actions = page.locator('section[aria-labelledby="home-actions-title"]');
    await expect(actions.getByRole('heading', { name: messages.homeActions.title, exact: true })).toBeVisible();
    await expect(actions.locator('summary')).toHaveText(messages.homeActions.more);
    await actions.locator('summary').click();
    await expect(actions.getByRole('link', { name: messages.homeActions.organizationJoin, exact: false })).toBeVisible();
  });
}

test('homepage prioritizes the area journey and recovers a failed section without navigation', async ({ page }, testInfo) => {
  let retrySections;
  await page.route('**/api/homepage*', async route => {
    const response = await route.fetch();
    const body = await response.json();
    const sections = new URL(route.request().url()).searchParams.get('sections');
    if (!sections) {
      delete body.data.polls;
      body.errors = { ...body.errors, polls: 'unavailable' };
    } else retrySections = sections;
    await route.fulfill({ response, json: body });
  });
  await page.goto('/');
  const actions = page.locator('section[aria-labelledby="home-actions-title"]');
  await expect(actions.getByRole('link', { name: /Find your area/ })).toBeVisible();
  await expect(actions.locator('details')).not.toHaveAttribute('open', '');
  await actions.locator('summary').click();
  await expect(actions.getByRole('link', { name: /Represent a party/ })).toBeVisible();
  const polls = page.getByRole('region', { name: en.home.top_polls_title, exact: true });
  await expect(polls.getByRole('alert')).toBeVisible();
  await page.evaluate(() => { window.__homepageDocument = 'same-document'; });
  await polls.getByRole('button', { name: en.homeRecovery.retry }).click();
  await expect(polls.getByRole('alert')).toHaveCount(0);
  await expect(polls.getByText('Improve our local park')).toBeVisible();
  await expect(polls.locator('a a')).toHaveCount(0);
  expect(retrySections).toBe('polls');
  expect(await page.evaluate(() => window.__homepageDocument)).toBe('same-document');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('homepage.png'), fullPage: true });
  await actions.getByRole('link', { name: /Find your area/ }).click();
  await expect(page).toHaveURL(/\/locations$/);
});

test('registers with an area, submits a proposal, votes and rejects admin access', async ({ page }) => {
  const username = `citizen-${Date.now()}`;
  await page.goto('/register');
  await page.locator('[name="username"]').fill(username);
  await page.locator('[name="email"]').fill(`${username}@example.test`);
  await page.locator('[name="password"]').fill('TestPassword123!');
  await page.locator('[name="confirmPassword"]').fill('TestPassword123!');
  await page.getByRole('button', { name: new RegExp(en.auth.optional_setup_title) }).click();
  for (const id of ['1', '2', '3']) {
    await page.locator('select').filter({ has: page.locator(`option[value="${id}"]`) }).first().selectOption(id);
  }
  await page.locator('[name="gdpr_consent"]').check();
  const registration = page.waitForResponse(response => response.url().endsWith('/api/auth/register') && response.request().method() === 'POST');
  await page.getByRole('button', { name: en.auth.submit_register, exact: true }).click();
  expect((await registration).status()).toBe(201);
  await expect(page).toHaveURL(/\/onboarding/);
  const profile = await (await page.request.get('/api/auth/profile')).json();
  expect(profile.data.user.homeLocationId).toBe(3);

  await page.goto('/suggestions/new');
  const title = `Safer paths ${username}`;
  await page.locator('[name="title"]').fill(title);
  await page.locator('[name="body"]').fill('Please improve the paths and lighting in our local park.');
  const creation = page.waitForResponse(response => response.url().endsWith('/api/suggestions') && response.request().method() === 'POST');
  await page.locator('form').filter({ has: page.locator('[name="title"]') }).locator('button[type="submit"]').click();
  expect((await creation).status()).toBe(201);
  await expect(page).toHaveURL(/\/suggestions\/\d+$/);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();

  await page.goto('/polls/1');
  await page.locator('#poll-ballot > summary').click();
  await page.getByRole('radio', { name: /More trees/ }).check();
  const vote = page.waitForResponse(response => /\/api\/polls\/1\/vote$/.test(response.url()) && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Υποβολή Ψήφου', exact: true }).click();
  expect((await vote).ok()).toBe(true);
  const result = await (await page.request.get('/api/polls/1')).json();
  expect(result.data.userVote.optionId).toBe(1);
  expect((await page.request.get('/api/auth/users/admin')).status()).toBe(403);
});
