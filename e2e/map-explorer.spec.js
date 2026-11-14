/* global window, document */
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => localStorage.setItem('appofa_country_entry_decision_v1', 'stay'));
});

test('map explorer links cards and pins, filters without moving the map, and resizes on mobile', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/locations/test-municipality');
  const explorer = page.getByRole('region', { name: 'Explore the area', exact: true });
  await expect(explorer.getByRole('heading', { name: 'Broken light on Oak Street' })).toBeVisible();
  await explorer.scrollIntoViewIfNeeded();
  const map = explorer.getByRole('region', { name: 'Map of Test Municipality' });
  await expect(map.locator('.map-issue-marker').first()).toBeVisible();
  const initialCount = await map.locator('.map-issue-marker').count();
  expect(initialCount).toBeGreaterThanOrEqual(3);
  const pane = map.locator('.leaflet-map-pane');
  let camera = await pane.getAttribute('style');
  const light = explorer.getByRole('button', { name: /Broken lighting Broken light on Oak Street/ });
  await light.click();
  await expect(explorer.getByRole('link', { name: 'Open issue' })).toBeVisible();
  await expect(map.locator('.map-issue-marker.is-selected')).toHaveCount(1);
  if (testInfo.project.name === 'mobile') {
    await expect.poll(async () => Math.round((await map.boundingBox()).height)).toBe(280);
    camera = await pane.getAttribute('style');
  } else expect(await pane.getAttribute('style')).toBe(camera);

  const filtered = page.waitForResponse(response => response.url().includes('/api/suggestions/map?') && response.url().includes('issueType=trash'));
  await explorer.getByLabel('Issue category', { exact: true }).selectOption('trash');
  expect((await filtered).ok()).toBe(true);
  await expect(explorer.getByRole('heading', { name: 'Rubbish beside the square' })).toBeVisible();
  await expect(explorer.getByRole('heading', { name: 'Broken light on Oak Street' })).toHaveCount(0);
  await expect(map.locator('.map-issue-marker')).toHaveCount(1);
  expect(await pane.getAttribute('style')).toBe(camera);
  await explorer.getByLabel('Issue status', { exact: true }).selectOption('implemented');
  await expect(explorer.getByText('No issues match these filters', { exact: true })).toBeVisible();
  await explorer.getByRole('button', { name: 'Clear filters' }).click();
  await expect(map.locator('.map-issue-marker')).toHaveCount(initialCount);

  if (testInfo.project.name === 'mobile') {
    const handle = explorer.getByRole('button', { name: 'Drag or activate to resize results' });
    await handle.focus();
    await handle.press('Enter');
    await expect(handle).toHaveAttribute('aria-expanded', 'false');
    await handle.press('Enter');
    await expect(handle).toHaveAttribute('aria-expanded', 'true');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await explorer.getByRole('button', { name: 'Expand explorer' }).click();
  await expect(explorer.getByRole('button', { name: 'Close expanded explorer' })).toBeVisible();
  await map.locator('img.leaflet-tile-loaded').first().waitFor({ timeout: 10000 }).catch(() => {});
  await explorer.screenshot({ path: testInfo.outputPath('map-explorer.png') });
  await page.keyboard.press('Escape');
  await expect(explorer.getByRole('button', { name: 'Expand explorer' })).toBeFocused();
  expect(errors).toEqual([]);
});

test('map explorer gates reporting and searches an address only on explicit submission', async ({ page }, testInfo) => {
  const login = await page.request.post('/api/auth/login', { data: { email: 'contributor@example.test', password: 'TestPassword123!' } });
  expect(login.ok()).toBe(true);
  let addressRequests = 0;
  await page.route('**/api/geo/search?**', route => {
    addressRequests += 1;
    return route.fulfill({ json: { success: true, data: [{ label: 'Oak Street, Test Municipality', lat: 37.985, lng: 23.724 }] } });
  });
  await page.goto('/locations/test-municipality');
  const explorer = page.getByRole('region', { name: 'Explore the area', exact: true });
  await expect(explorer.getByRole('heading', { name: 'Broken light on Oak Street' })).toBeVisible();
  const search = explorer.getByRole('searchbox', { name: 'Search issues, areas or a street' });
  await search.fill('Oak Street');
  await expect(explorer.getByRole('heading', { name: 'Rubbish beside the square' })).toHaveCount(0);
  expect(addressRequests).toBe(0);
  await explorer.getByRole('button', { name: 'Find address' }).click();
  await explorer.getByRole('button', { name: 'Oak Street, Test Municipality', exact: true }).click();
  expect(addressRequests).toBe(1);
  const map = explorer.getByRole('region', { name: 'Map of Test Municipality' });
  await map.click({ position: { x: 130, y: 180 } });
  await expect(explorer.locator('textarea')).toHaveCount(0);
  await explorer.getByRole('button', { name: 'Report an issue', exact: true }).click();
  await expect(explorer.getByText('Select a point on the map', { exact: true }).first()).toBeVisible();
  await map.click({ position: { x: 130, y: 180 } });
  await expect(explorer.locator('textarea')).toBeVisible();
  const reportTitle = `A new map report for the neighbourhood ${testInfo.project.name}`;
  await explorer.getByLabel('Τίτλος', { exact: true }).fill(reportTitle);
  await explorer.getByLabel('Περιγραφή', { exact: true }).fill('Please repair this damaged section of the pavement.');
  const posted = page.waitForResponse(response => /\/api\/suggestions$/.test(response.url()) && response.request().method() === 'POST');
  await explorer.getByRole('button', { name: 'Δημοσίευση ζητήματος', exact: true }).click();
  expect((await posted).status()).toBe(201);
  await expect(explorer.getByRole('heading', { name: reportTitle })).toBeVisible();
  await expect(explorer.getByRole('button', { name: 'Report an issue', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test('map explorer combines parent areas and descendant issues in a single map', async ({ page }) => {
  await page.goto('/locations/attica');
  const explorer = page.getByRole('region', { name: 'Explore the area', exact: true });
  await expect(explorer).toHaveCount(1);
  await expect(page.locator('#location-children-explorer')).toHaveCount(0);
  await expect(explorer.getByRole('heading', { name: 'Broken light on Oak Street' })).toBeVisible();
  await explorer.getByRole('tab', { name: 'Areas 1', exact: true }).click();
  await explorer.getByRole('tabpanel', { name: 'Areas' }).getByRole('button', { name: 'Test Municipality', exact: true }).click();
  await explorer.getByRole('link', { name: 'Explore area', exact: false }).click();
  await expect(page).toHaveURL(/\/locations\/test-municipality$/);
});

test('map explorer shows local cameras alongside issues and links camera pins to cards', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/locations/attica');
  const explorer = page.getByRole('region', { name: 'Explore the area', exact: true });
  const map = explorer.getByRole('region', { name: 'Map of Attica' });
  await expect(map.locator('.map-camera-marker')).toHaveCount(2);
  await expect.poll(() => map.locator('.map-issue-marker').count()).toBeGreaterThanOrEqual(3);
  await explorer.getByRole('tab', { name: 'Cameras 2', exact: true }).click();
  const panel = explorer.getByRole('tabpanel', { name: 'Cameras' });
  await expect(panel.getByRole('heading', { name: 'Harbour camera' })).toBeVisible();
  await expect(panel.getByText('Working', { exact: true })).toBeVisible();
  await expect(panel.getByText('Temporarily unavailable', { exact: true })).toBeVisible();
  await expect(panel.getByText('Exact camera pin', { exact: true })).toBeVisible();
  await expect(panel.getByText('Source location pin', { exact: true })).toBeVisible();
  const stream = panel.getByRole('link', { name: 'Open camera Harbour camera in a new tab' });
  await expect(stream).toHaveAttribute('href', 'https://camera.example/harbour');
  await expect(stream).toHaveAttribute('target', '_blank');
  await map.locator('.leaflet-marker-icon[title="Harbour camera"]').click();
  await expect(map.locator('.map-camera-marker.is-selected')).toHaveCount(1);
  await expect(panel.getByRole('button', { name: /Working Harbour camera/ })).toHaveAttribute('aria-pressed', 'true');
  if (testInfo.project.name === 'mobile') {
    await expect.poll(async () => Math.round((await map.boundingBox()).height)).toBe(280);
  }
  await explorer.screenshot({ path: testInfo.outputPath('map-cameras.png') });
  const pane = map.locator('.leaflet-map-pane');
  const viewport = await pane.getAttribute('style');
  await explorer.getByLabel('Issue category', { exact: true }).selectOption('trash');
  await expect(map.locator('.map-issue-marker')).toHaveCount(1);
  await expect(map.locator('.map-camera-marker')).toHaveCount(2);
  expect(await pane.getAttribute('style')).toBe(viewport);
  await explorer.getByRole('searchbox').fill('harbour');
  await expect(map.locator('.map-camera-marker')).toHaveCount(1);
  await expect(panel.getByRole('heading', { name: 'Town square camera' })).toHaveCount(0);
  await panel.getByRole('button', { name: 'Show on map', exact: true }).click();
  await expect(map.locator('.map-camera-marker.is-selected')).toHaveCount(1);
  expect(errors).toEqual([]);
});
