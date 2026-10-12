const { test, expect } = require('@playwright/test');
const auth = require('../messages/en.json').auth;
const t = require('../messages/calendar/en.json');

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => localStorage.setItem('appofa_country_entry_decision_v1', 'stay'));
});

test('create a location event, display in both calendar views, export and cancel', async ({ page }, testInfo) => {
  await page.goto('/login');
  await page.locator('[name="email"]').fill('author@example.test');
  await page.locator('[name="password"]').fill('TestPassword123!');
  const dismiss = page.getByRole('button', { name: 'Reject Non-Essential', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
  await page.getByRole('button', { name: auth.submit_login, exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto('/events/new?locationId=3');
  const title = `Community cleanup ${testInfo.project.name}`;
  await page.getByLabel(t.eventTitle, { exact: true }).fill(title);
  await page.getByLabel(t.description, { exact: true }).fill('Meet at the town square to clean the park.');
  await page.getByLabel(t.start, { exact: true }).fill('2026-10-20T10:00');
  await page.getByLabel(t.end, { exact: true }).fill('2026-10-20T12:00');
  await page.getByLabel(t.venue, { exact: true }).fill('Town square');
  await page.getByLabel(t.timezoneSearch, { exact: true }).fill('Bucharest');
  await page.getByLabel(t.timezone, { exact: true }).selectOption('Europe/Bucharest');
  await page.getByRole('button', { name: t.save }).click();
  await expect(page).toHaveURL(/\/events\/\d+$/);
  const detailUrl = page.url();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText(t.statuses.published, { exact: true })).toBeVisible();
  await expect(page.getByText(/Europe\/Bucharest/)).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: t.export }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/event-\d+\.ics/);
  await page.goto('/locations/test-municipality?tab=events');
  await expect(page.getByLabel(t.period, { exact: true })).toHaveValue('upcoming');
  await page.getByLabel(t.period, { exact: true }).selectOption('month');
  await page.getByLabel(t.month, { exact: true }).fill('2026-10');
  await expect(page.getByRole('link').filter({ hasText: title })).toBeVisible();
  await page.getByLabel(t.view).selectOption('month');
  await page.getByRole('button', { name: /^October 20, 2026:/ }).click();
  await expect(page.getByRole('link').filter({ hasText: title }).last()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('#tabpanel-events').screenshot({ path: testInfo.outputPath('location-calendar.png') });
  await page.goto('/calendar');
  await page.getByLabel(t.period, { exact: true }).selectOption('month');
  await page.getByLabel(t.month, { exact: true }).fill('2026-10');
  await expect(page.getByRole('link').filter({ hasText: title })).toBeVisible();
  await page.goto(detailUrl);
  await page.getByRole('button', { name: t.cancel, exact: true }).click();
  await expect(page.getByText(t.statuses.cancelled, { exact: true })).toBeVisible();
});

test('calendar follows the selected language', async ({ page, context }) => {
  for (const locale of ['el', 'ro', 'en']) {
    const messages = require(`../messages/calendar/${locale}.json`);
    await context.addCookies([{ name: 'NEXT_LOCALE', value: locale, domain: '127.0.0.1', path: '/' }]);
    await page.goto('/calendar');
    await expect(page.getByRole('heading', { name: messages.title, exact: true })).toBeVisible();
    await expect(page.getByLabel(messages.period, { exact: true })).toHaveValue('upcoming');
    await page.getByLabel(messages.view, { exact: true }).selectOption('month');
    await expect(page.getByRole('button', { name: messages.nextMonth, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('moderator rejection supplies private feedback and notifies the author', async ({ page, browser }, testInfo) => {
  async function login(target, email) {
    await target.goto('/login');
    const dismiss = target.getByRole('button', { name: 'Reject Non-Essential', exact: true });
    if (await dismiss.isVisible()) await dismiss.click();
    await target.locator('[name="email"]').fill(email);
    await target.locator('[name="password"]').fill('TestPassword123!');
    await target.getByRole('button', { name: auth.submit_login, exact: true }).click();
    await expect(target).not.toHaveURL(/\/login/);
  }
  await login(page, 'contributor@example.test');
  await page.goto('/events/new?locationId=3');
  const title = `Review event ${testInfo.project.name}`;
  await page.getByLabel(t.eventTitle, { exact: true }).fill(title);
  await page.getByLabel(t.description, { exact: true }).fill('A community meeting.');
  await page.getByLabel(t.start, { exact: true }).fill('2026-10-20T10:00');
  await page.getByLabel(t.end, { exact: true }).fill('2026-10-20T12:00');
  await page.getByRole('button', { name: t.save, exact: true }).click();
  await expect(page).toHaveURL(/\/events\/\d+$/);
  await expect(page.getByText(t.statuses.pending, { exact: true })).toBeVisible();
  const url = page.url();
  const adminContext = await browser.newContext({ baseURL: 'http://127.0.0.1:3101', viewport: testInfo.project.use.viewport });
  try {
    await adminContext.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
    await adminContext.addInitScript(() => localStorage.setItem('appofa_country_entry_decision_v1', 'stay'));
    const adminPage = await adminContext.newPage();
    await login(adminPage, 'author@example.test');
    await adminPage.goto(url);
    await adminPage.getByRole('button', { name: t.reject, exact: true }).click();
    await adminPage.getByLabel(t.rejectReason, { exact: true }).fill('Please add the venue address.');
    await adminPage.getByRole('button', { name: t.confirmReject, exact: true }).click();
    await expect(adminPage.getByText(t.statuses.rejected, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('Please add the venue address.', { exact: true })).toBeVisible();
    await page.goto('/notifications');
    await expect(page.getByText(t.notifications.rejected, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  } finally { await adminContext.close(); }
});
