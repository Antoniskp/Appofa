/* global document, window */
const { test, expect } = require('@playwright/test');
const { submitPasswordLogin } = require('./helpers/password-auth');
const t = require('../messages/calendar/en.json');

async function prepareCalendarContext(context) {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => {
    localStorage.setItem('appofa_country_entry_decision_v1', 'stay');
    localStorage.setItem('gdpr_consent', JSON.stringify({ necessary: true, analytics: false, functional: false }));
  });
}

test.beforeEach(async ({ context }) => {
  await prepareCalendarContext(context);
});

test('create a location event, display in both calendar views, export and cancel', async ({ page }, testInfo) => {
  await page.goto('/login');
  await submitPasswordLogin(page, 'author@example.test');
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
  const locationCalendar = page.locator('#tabpanel-events');
  await expect(locationCalendar.getByRole('button', { name: t.month, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await locationCalendar.getByRole('button', { name: t.list, exact: true }).click();
  await expect(page.getByLabel(t.period, { exact: true })).toHaveValue('upcoming');
  await page.getByLabel(t.period, { exact: true }).selectOption('month');
  await page.getByLabel(t.month, { exact: true }).fill('2026-10');
  await expect(page.getByRole('link').filter({ hasText: title })).toBeVisible();
  await page.getByRole('button', { name: t.month, exact: true }).click();
  await page.getByRole('button', { name: /^October 20, 2026:/ }).click();
  await expect(locationCalendar.getByRole('link', { name: new RegExp(title) }).last()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('#tabpanel-events').screenshot({ path: testInfo.outputPath('location-calendar.png') });
  await page.goto('/calendar');
  await expect(page.getByRole('button', { name: t.month, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: t.browseEvents, exact: true }).click();
  await expect(page.getByRole('combobox', { name: t.status, exact: true })).toHaveCount(0);
  await page.getByLabel(t.month, { exact: true }).fill('2026-10');
  await page.getByRole('button', { name: t.jumpToNextEvent, exact: true }).click();
  await expect(page).toHaveURL(/day=2026-10-20/);
  await expect(page.getByRole('link', { name: new RegExp(title) }).last()).toBeVisible();
  await page.goto(detailUrl);
  await page.getByRole('button', { name: t.cancel, exact: true }).click();
  await expect(page.getByText(t.statuses.cancelled, { exact: true })).toBeVisible();
});

test('personal calendar opens empty and shows events from enabled subscriptions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await submitPasswordLogin(page, 'contributor@example.test');
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto('/calendar?mode=list&period=month&month=2024-06');
  await expect(page.getByRole('button', { name: t.myCalendar })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(t.selectSources)).toBeVisible();
  await expect(page.getByText(t.noSubscriptions)).toBeVisible();
  const manage = page.getByRole('button', { name: t.manageSubscriptions });
  await manage.click();
  const electionSubscription = page.getByRole('checkbox', { name: t.categories.elections });
  await electionSubscription.click();
  await expect(electionSubscription).toBeChecked();
  await page.getByRole('button', { name: t.chooseLocation }).click();
  await page.getByRole('button', { name: /^Test Municipality/ }).click();
  await page.getByRole('button', { name: t.followLocation, exact: true }).click();
  await expect(page.getByRole('button', { name: t.unfollowLocation.replace('{location}', 'Test Municipality') })).toBeVisible();
  await manage.click();
  const electionPill = page.getByRole('button', { name: t.categories.elections, exact: true });
  const allCategories = page.getByRole('button', { name: t.allCategories, exact: true });
  const locationPill = page.getByRole('button', { name: 'Test Municipality', exact: true });
  const election = page.getByRole('link', { name: /European Parliament election in Greece/ });
  await expect(electionPill).toHaveAttribute('aria-pressed', 'false');
  await expect(locationPill).toHaveAttribute('aria-pressed', 'false');
  await allCategories.click();
  await expect(election).toBeVisible();
  await expect(electionPill).toHaveAttribute('aria-pressed', 'true');
  await locationPill.click();
  await expect(locationPill).toHaveAttribute('aria-pressed', 'true');
  await expect(election).toHaveCount(1);
  await electionPill.click();
  await expect(election).toHaveCount(0);
  await page.goto('/calendar');
  await expect(locationPill).toHaveAttribute('aria-pressed', 'false');
  await expect(electionPill).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText(t.selectSources)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await manage.click();
  await page.getByRole('button', { name: t.unfollowLocation.replace('{location}', 'Test Municipality') }).click();
  await expect(locationPill).toHaveCount(0);
});

test('calendar follows the selected language', async ({ page, context }) => {
  for (const locale of ['el', 'ro', 'en']) {
    const messages = require(`../messages/calendar/${locale}.json`);
    await context.addCookies([{ name: 'NEXT_LOCALE', value: locale, domain: '127.0.0.1', path: '/' }]);
    await page.goto('/calendar');
    await expect(page.getByRole('heading', { name: messages.title, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: messages.month, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: messages.nextMonth, exact: true })).toBeVisible();
    await page.getByRole('button', { name: messages.list, exact: true }).click();
    await expect(page.getByRole('combobox', { name: messages.period, exact: true })).toHaveValue('upcoming');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('moderator rejection supplies private feedback and notifies the author', async ({ page, browser }, testInfo) => {
  async function login(target, email) {
    await target.goto('/login');
    await submitPasswordLogin(target, email);
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
    await prepareCalendarContext(adminContext);
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

test('calendar category pills combine and reset on mobile and survive browser history', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/calendar?category=culture&month=2024-06&mode=list&period=month');
  await expect(page.getByRole('button', { name: t.list, exact: true })).toHaveAttribute('aria-pressed', 'true');
  const culture = page.getByRole('button', { name: t.categories.culture, exact: true });
  const elections = page.getByRole('button', { name: t.categories.elections, exact: true });
  const all = page.getByRole('button', { name: t.allCategories, exact: true });
  const election = page.getByRole('link', { name: /European Parliament election in Greece/ });
  await expect(culture).toHaveAttribute('aria-pressed', 'true');
  await expect(all).toHaveAttribute('aria-pressed', 'false');
  await elections.click();
  await expect(culture).toHaveAttribute('aria-pressed', 'true');
  await expect(elections).toHaveAttribute('aria-pressed', 'true');
  await expect(election).toBeVisible();
  await page.reload();
  await expect(culture).toHaveAttribute('aria-pressed', 'true');
  await expect(elections).toHaveAttribute('aria-pressed', 'true');
  await page.goBack();
  await expect(culture).toHaveAttribute('aria-pressed', 'true');
  await expect(elections).toHaveAttribute('aria-pressed', 'false');
  await expect(election).toHaveCount(0);
  await page.goForward();
  await expect(elections).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('#main-content').getByRole('main').screenshot({
    path: testInfo.outputPath('calendar-category-pills-mobile.png'),
    animations: 'disabled',
  });
  await elections.click();
  await expect(culture).toHaveAttribute('aria-pressed', 'true');
  await expect(elections).toHaveAttribute('aria-pressed', 'false');
  await expect(election).toHaveCount(0);
  await all.click();
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect(culture).toHaveAttribute('aria-pressed', 'false');
  await expect(election).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('older calendar period links still open the list', async ({ page }) => {
  await page.goto('/calendar?period=past');
  await expect(page.getByRole('button', { name: t.list, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('combobox', { name: t.period, exact: true })).toHaveValue('past');
  await page.getByRole('button', { name: t.month, exact: true }).click();
  await expect(page.getByRole('button', { name: t.month, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: t.nextMonth, exact: true })).toBeVisible();
});

test('mobile calendar jumps across months to an election and links to the official source', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/calendar?month=2024-05&day=2024-05-31&category=elections');
  await page.getByRole('button', { name: t.jumpToNextEvent, exact: true }).click();
  await expect(page).toHaveURL(/day=2024-06-09/);
  await expect(page).toHaveURL(/category=elections/);
  await expect(page.getByRole('heading', { name: 'Events on June 9, 2024' })).toBeFocused();
  await expect(page.getByRole('button', { name: /June 9, 2024:.*Elections/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('list', { name: t.category, exact: true })).toHaveText(t.categories.elections);
  const entry = page.getByRole('link', { name: /European Parliament election in Greece/ });
  await expect(entry).toHaveAttribute('href', 'https://results.elections.europa.eu/en/greece/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.setViewportSize({ width: 1280, height: 800 });
  const gridEntry = entry.first();
  await expect(gridEntry.getByText(t.categories.elections, { exact: true })).toBeVisible();
});
