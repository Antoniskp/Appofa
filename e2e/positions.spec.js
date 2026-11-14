/* global document, window */
const { test, expect } = require('@playwright/test');
const t = require('../messages/en.json').positions;
const auth = require('../messages/en.json').auth;
test.setTimeout(180000);

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => localStorage.setItem('appofa_country_entry_decision_v1', 'stay'));
});

async function login(page, email) {
  await page.goto('/login');
  await page.locator('[name="email"]:visible').fill(email);
  await page.locator('[name="password"]:visible').fill('TestPassword123!');
  await page.getByRole('button', { name: auth.submit_login, exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
async function dismissCookies(page) {
  const dismiss = page.getByRole('button', { name: 'Reject Non-Essential', exact: true });
  if (await dismiss.isVisible()) await dismiss.click();
}

test('create, review, compare, vote and revise an organization position', async ({ page, browser }, testInfo) => {
  const title = 'Build public rental homes ' + testInfo.project.name;
  await login(page, 'author@example.test');
  await page.goto('/organizations/civic-policy-lab?tab=tab_positions');
  await dismissCookies(page);
  await page.getByRole('button', { name: t.add_position, exact: true }).click();
  await page.getByLabel(t.title_label, { exact: true }).fill(title);
  await page.getByRole('textbox', { name: t.body_label, exact: true }).fill('Build affordable rental housing with transparent eligibility criteria.');
  await page.getByRole('combobox', { name: t.category, exact: true }).first().selectOption({ label: 'Housing' });
  await page.getByLabel('Public housing', { exact: true }).check();
  await page.getByLabel(t.provider, { exact: true }).fill('Vouliwatch');
  await page.getByLabel(t.source_url, { exact: true }).fill('https://vouliwatch.gr/policies');
  await page.getByLabel(t.original_url, { exact: true }).fill('https://example.org/housing-programme');
  await page.screenshot({ path: testInfo.outputPath('position-editor.png'), fullPage: true });
  await page.getByRole('button', { name: t.save_draft, exact: true }).click();
  let card = page.locator('article').filter({ hasText: title });
  await expect(card.getByText('Draft · v1', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: t.review, exact: true }).click();
  await card.getByLabel(t.review_confirm, { exact: true }).check();
  await card.getByRole('button', { name: t.publish, exact: true }).click();
  await expect(card.getByText('Published · v1', { exact: true })).toBeVisible();

  const voterContext = await browser.newContext({ viewport: testInfo.project.use.viewport });
  try {
    await voterContext.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
    await voterContext.addInitScript(() => localStorage.setItem('appofa_country_entry_decision_v1', 'stay'));
    const voterPage = await voterContext.newPage();
    // newContext does not inherit baseURL.
    await voterPage.goto('http://127.0.0.1:3101/login');
    await voterPage.locator('[name="email"]').fill('contributor@example.test');
    await voterPage.locator('[name="password"]').fill('TestPassword123!');
    await voterPage.getByRole('button', { name: auth.submit_login, exact: true }).click();
    await expect(voterPage).not.toHaveURL(/\/login/);
    await voterPage.goto('http://127.0.0.1:3101/positions');
    await dismissCookies(voterPage);
    await expect(voterPage.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
    await voterPage.screenshot({ path: testInfo.outputPath('positions-first-screen.png') });
    await expect(voterPage.getByRole('group', { name: t.filters, exact: true })).toHaveCount(1);
    await expect(voterPage.getByRole('combobox', { name: t.topic, exact: true })).toHaveCount(0);
    await voterPage.getByText(t.view_all, { exact: true }).click();
    await expect(voterPage.getByRole('radio', { name: t.view_all, exact: true })).toBeChecked();
    let voterCard = voterPage.locator('article').filter({ hasText: title });
    await expect(voterCard.getByText('Housing', { exact: true })).toBeVisible();
    await voterCard.getByRole('button', { name: `${t.support} 0`, exact: true }).click();
    await expect(voterCard.getByRole('button', { name: `${t.support} 1`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await voterCard.getByRole('button', { name: `${t.oppose} 0`, exact: true }).click();
    await expect(voterCard.getByRole('button', { name: `${t.oppose} 1`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await voterCard.getByRole('button', { name: `${t.oppose} 1`, exact: true }).click();
    await expect(voterCard.getByText(t.no_votes, { exact: true })).toBeVisible();
    await voterCard.getByRole('button', { name: `${t.support} 0`, exact: true }).click();
    await expect(voterCard.getByRole('button', { name: `${t.support} 1`, exact: true })).toBeVisible();
    const positionHref = await voterCard.getByRole('link', { name: title, exact: true }).getAttribute('href');
    const detailPage = await voterContext.newPage();
    await detailPage.goto('http://127.0.0.1:3101' + positionHref);
    await expect(detailPage).toHaveURL(/\/positions\/\d+$/);
    await expect(detailPage.getByText(t.low_participation, { exact: true })).toBeVisible();
    await expect(detailPage.getByText(t.approval_percent.replace('{percent}', '100'), { exact: true })).toHaveCount(0);
    await voterPage.getByRole('searchbox', { name: t.search }).fill('no-matching-proposal');
    await expect(voterPage.locator('article')).toHaveCount(0);
    await voterPage.getByRole('searchbox', { name: t.search }).fill(title);
    await expect(voterPage.locator('article')).toHaveCount(1);
    await voterPage.getByRole('combobox', { name: t.category, exact: true }).selectOption({ label: 'Housing' });
    await voterPage.getByRole('button', { name: t.compare, exact: true }).click();
    await voterPage.getByRole('checkbox', { name: 'Civic Policy Lab', exact: true }).check();
    await voterPage.getByRole('checkbox', { name: 'Community Forum', exact: true }).check();
    await expect(voterPage.getByRole('region', { name: 'Civic Policy Lab', exact: true }).getByRole('heading', { name: title, exact: true })).toBeVisible();
    await voterPage.getByRole('searchbox', { name: t.search }).fill('');
    await expect(voterPage.getByRole('region', { name: 'Community Forum', exact: true }).getByText(t.no_recorded_position, { exact: true })).toBeVisible();
    await voterPage.screenshot({ path: testInfo.outputPath('comparison-columns.png'), fullPage: true });
    await voterPage.getByRole('button', { name: t.list_view, exact: true }).click();
    await voterPage.getByRole('searchbox', { name: t.search }).fill('');
    expect(await voterPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await voterPage.screenshot({ path: testInfo.outputPath('position-comparison.png'), fullPage: true });

    await page.goto('/organizations/civic-policy-lab?tab=tab_positions');
    await page.getByRole('button', { name: t.manage, exact: true }).click();
    card = page.locator('article').filter({ hasText: title });
    await card.getByRole('button', { name: t.new_version, exact: true }).click();
    await page.getByRole('textbox', { name: t.body_label, exact: true }).fill('Revised housing proposal with a delivery timetable.');
    await page.getByRole('button', { name: t.save_draft, exact: true }).click();
    card = page.locator('article').filter({ hasText: title }).filter({ hasText: 'Draft · v2' });
    await card.getByRole('button', { name: t.review, exact: true }).click();
    await card.getByLabel(t.review_confirm, { exact: true }).check();
    await card.getByRole('button', { name: t.publish, exact: true }).click();
    await expect(page.locator('article').filter({ hasText: title }).getByText('Published · v2')).toBeVisible();
    await voterPage.reload();
    voterCard = voterPage.locator('article').filter({ hasText: title });
    await expect(voterCard.getByText(t.no_votes, { exact: true })).toBeVisible();
    await detailPage.reload();
    const historyCard = detailPage.locator('article').filter({ hasText: title });
    await historyCard.getByText(t.details, { exact: true }).click();
    await historyCard.getByRole('button', { name: t.history, exact: true }).click();
    await expect(historyCard.getByText('v1 · Previous version', { exact: true })).toBeVisible();
    await expect(historyCard.getByText(`${t.support}: 1 · ${t.oppose}: 0 · ${t.view_unsure}: 0`, { exact: true })).toBeVisible();
    await expect(historyCard.getByRole('link', { name: '#Public housing', exact: true }))
      .toHaveAttribute('href', '/topics/public-housing');
  } finally { await voterContext.close(); }
});
