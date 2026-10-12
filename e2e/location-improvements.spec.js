const { test, expect } = require('@playwright/test');
const t = require('../messages/en.json').locationImprovements;
const auth = require('../messages/en.json').auth;

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => localStorage.setItem('appofa_country_entry_decision_v1', 'stay'));
});

async function login(page, email) {
  await page.locator('[name="email"]').fill(email);
  await page.locator('[name="password"]').fill('TestPassword123!');
  await page.getByRole('button', { name: auth.submit_login, exact: true }).click();
}

test('guest draft survives sign-in, is reviewed, and appears on the location page', async ({ page, browser }, testInfo) => {
  await page.goto('/locations/test-municipality');
  await page.getByRole('link', { name: t.improve, exact: true }).click();
  const cookieDismiss = page.getByRole('button', { name: 'Reject Non-Essential', exact: true });
  if (await cookieDismiss.isVisible()) await cookieDismiss.click();
  const description = `A community library and riverside walks. ${testInfo.project.name}`;
  await page.getByLabel(t.proposed, { exact: true }).fill(description);
  await page.getByLabel(t.source, { exact: true }).fill('https://example.org/local-history');
  await page.screenshot({ path: testInfo.outputPath('contribution-form.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('link', { name: t.signIn }).click();
  await login(page, 'contributor@example.test');
  await expect(page).toHaveURL(/\/locations\/test-municipality\/improve$/);
  await expect(page.getByLabel(t.proposed, { exact: true })).toHaveValue(description);
  await page.getByRole('button', { name: t.submit, exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: t.submitted })).toBeVisible();
  await expect(page.getByText(t.statuses.pending, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: t.review, exact: true })).toHaveCount(0);

  const adminContext = await browser.newContext({ viewport: testInfo.project.use.viewport });
  try {
    await adminContext.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
    await adminContext.addInitScript(() => localStorage.setItem('appofa_country_entry_decision_v1', 'stay'));
    const adminPage = await adminContext.newPage();
    await adminPage.goto('http://127.0.0.1:3101/login');
    await login(adminPage, 'author@example.test');
    await expect(adminPage).not.toHaveURL(/\/login/);
    await adminPage.goto('http://127.0.0.1:3101/locations/test-municipality/improve');
    await adminPage.getByRole('button', { name: t.review, exact: true }).click();
    let card = adminPage.locator('article').filter({ hasText: description });
    await card.getByLabel(t.reviewNote, { exact: true }).fill('Please confirm the library details.');
    await card.getByRole('button', { name: t.clarify, exact: true }).click();
    await expect(card.getByText(t.statuses.needs_clarification, { exact: true })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: t.mine, exact: true }).click();
    await page.locator('article').filter({ hasText: description }).getByRole('button', { name: t.revise, exact: true }).click();
    await page.getByLabel(t.note, { exact: true }).fill('Confirmed with the local library.');
    await page.getByRole('button', { name: t.submit, exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: t.submitted })).toBeVisible();
    await adminPage.reload();
    await adminPage.getByRole('button', { name: t.review, exact: true }).click();
    card = adminPage.locator('article').filter({ hasText: description });
    await card.getByRole('button', { name: t.accept, exact: true }).click();
    await expect(adminPage.getByRole('status').filter({ hasText: t.reviewSaved })).toBeVisible();
    await adminPage.getByRole('button', { name: t.history, exact: true }).click();
    await expect(adminPage.locator('article').filter({ hasText: description }).first()).toBeVisible();
    await adminPage.screenshot({ path: testInfo.outputPath('contribution-history.png'), fullPage: true });
  } finally { await adminContext.close(); }

  await page.goto('/locations/test-municipality');
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('location-contribution.png'), fullPage: true });
});
