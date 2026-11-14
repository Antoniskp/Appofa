/* global document, window */
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => {
    localStorage.setItem('appofa_country_entry_decision_v1', 'stay');
    localStorage.setItem('gdpr_consent', JSON.stringify({ necessary: true, analytics: false, functional: false, timestamp: Date.now() }));
  });
});

test('homepage local map searches areas and shows public issue, vote and camera layers', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const section = page.getByRole('region', { name: 'What’s happening in your area', exact: true });
  await section.scrollIntoViewIfNeeded();
  const areas = section.getByRole('list', { name: 'Explore areas', exact: true });
  await expect(areas.getByRole('button', { name: /Attica/ })).toBeVisible();
  await expect(section.locator('.home-map-count')).toHaveCount(1);
  await areas.getByRole('button', { name: /Attica/ }).click();
  await expect(section.getByRole('heading', { name: 'Broken light on Oak Street', exact: true })).toBeVisible();
  // Reporting journeys may already have added public issues to this shared area.
  await expect.poll(() => section.locator('.map-issue-marker').count()).toBeGreaterThanOrEqual(2);
  const search = section.getByRole('searchbox', { name: 'Search a municipality or area' });
  await search.fill('Test Municipality');
  const result = section.locator('#home-map-search-results').getByRole('button', { name: /Test Municipality/ });
  await expect(result).toBeVisible();
  await result.focus();
  await result.press('Enter');
  await expect(section.getByRole('heading', { name: 'Test Municipality', exact: true })).toBeVisible();
  await expect(section.getByRole('link', { name: 'Explore this area', exact: false })).toHaveAttribute('href', '/locations/test-municipality');
  const layers = section.getByRole('group', { name: 'Map content' });
  await layers.getByRole('button', { name: 'Votes', exact: true }).click();
  await expect(section.getByRole('heading', { name: 'Improve our local park', exact: true })).toBeVisible();
  await expect(section.locator('.map-poll-marker')).toHaveCount(1);
  await expect(section.getByText('Area location — approximate pin', { exact: true })).toBeVisible();
  await layers.getByRole('button', { name: 'Cameras', exact: true }).click();
  await expect(section.locator('.map-camera-marker')).toHaveCount(2);
  await expect(section.getByRole('heading', { name: 'Harbour camera', exact: true })).toBeVisible();
  await expect(section.getByText('Temporarily unavailable', { exact: true })).toBeVisible();
  await expect(section.getByRole('link', { name: 'Open Harbour camera', exact: true })).toHaveAttribute('href', 'https://camera.example/harbour');
  await section.locator('.leaflet-marker-icon[title="Harbour camera"]').click();
  await expect(section.locator('.map-camera-marker.is-selected')).toHaveCount(1);
  if (testInfo.project.name === 'mobile') {
    const collapse = section.getByRole('button', { name: 'Collapse results', exact: true });
    await collapse.click();
    await expect(section.getByRole('button', { name: 'Show results', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await section.getByRole('button', { name: 'Show results', exact: true }).click();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await section.locator('img.leaflet-tile-loaded').first().waitFor({ timeout: 5000 }).catch(() => {});
  await section.screenshot({ path: testInfo.outputPath('homepage-local-map.png') });
  await section.getByRole('button', { name: 'All Greece', exact: true }).click();
  await expect(section.getByRole('heading', { name: 'Greece', exact: true })).toBeVisible();
  await expect(section.locator('.home-map-count')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('homepage local map distinguishes unavailable data from no activity and retries', async ({ page }) => {
  let failing = true;
  await page.route('**/api/locations/map-activity**', route => failing
    ? route.fulfill({ status: 503, json: { success: false } }) : route.continue());
  await page.goto('/');
  const section = page.getByRole('region', { name: 'What’s happening in your area', exact: true });
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole('alert')).toContainText('Map activity could not be loaded.');
  failing = false;
  await section.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(section.getByRole('alert')).toHaveCount(0);
  await expect(section.locator('.home-map-count')).toHaveCount(1);
});
