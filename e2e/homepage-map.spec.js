/* global document, window */
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => {
    localStorage.setItem('appofa_country_entry_decision_v1', 'stay');
    localStorage.setItem('gdpr_consent', JSON.stringify({ necessary: true, analytics: false, functional: false, timestamp: Date.now() }));
  });
});

test('homepage local map keeps background tiles visible after expanding and closing', async ({ page }, testInfo) => {
  // Keep the rendering check independent of the tile provider's network status.
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><path fill="#cbd5e1" d="M0 0h256v256H0z"/></svg>',
  }));
  await page.goto('/');
  const section = page.getByRole('region', { name: 'What’s happening in your area', exact: true });
  await section.scrollIntoViewIfNeeded();
  const map = section.getByRole('region', { name: /^Local activity map:/ });
  const expectVisibleTiles = async () => {
    // A loaded image can still disappear when CSS collapses its width to zero.
    await expect.poll(() => map.locator('img.leaflet-tile-loaded').evaluateAll(tiles => tiles.some(tile => {
      const bounds = tile.getBoundingClientRect();
      const viewport = tile.closest('[role="region"]').getBoundingClientRect();
      return tile.naturalWidth === 256 && bounds.width >= 255 && bounds.height >= 255
        && bounds.right > viewport.left && bounds.left < viewport.right
        && bounds.bottom > viewport.top && bounds.top < viewport.bottom;
    }))).toBe(true);
  };

  await expectVisibleTiles();
  for (let cycle = 0; cycle < 2; cycle += 1) {
    await section.getByRole('button', { name: 'Expand map', exact: true }).click();
    await expectVisibleTiles();
    if (cycle === 0) await section.getByRole('button', { name: 'Close map', exact: true }).click();
    else await page.keyboard.press('Escape');
    await expect(section.getByRole('button', { name: 'Expand map', exact: true })).toBeVisible();
    await expectVisibleTiles();
  }
  await section.screenshot({ path: testInfo.outputPath('homepage-map-after-expanding.png') });
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

test('homepage local map loads electoral boundaries in Greek without translation errors', async ({ page, context }) => {
  const messages = require('../messages/el.json');
  const labels = messages.homeMap;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /MISSING_MESSAGE|IntlError/.test(message.text())) errors.push(message.text());
  });
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'el', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/');
  const section = page.getByRole('region', { name: messages.home.explore_locations_title, exact: true });
  await section.scrollIntoViewIfNeeded();
  const boundaries = page.waitForResponse(response => new URL(response.url()).pathname === '/api/electoral-districts');
  await section.getByRole('button', { name: labels.parliamentarians, exact: true }).click();
  const response = await boundaries;
  expect(response.status()).toBe(200);
  expect((await response.json()).features).toHaveLength(59);
  const panel = section.getByRole('complementary', { name: labels.electoral.results, exact: true });
  await expect(panel.getByRole('list', { name: labels.electoral.allDistricts, exact: true }).getByRole('button')).toHaveCount(60);
  await expect(section.getByRole('alert')).toHaveCount(0);
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

test('homepage local map shows electoral districts and their MPs', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /MISSING_MESSAGE|IntlError/.test(message.text())) errors.push(message.text());
  });
  await page.route('**/api/persons?**', route => route.fulfill({ json: { success: true, data: {
    profiles: [{ id: 1001, slug: 'test-athens-mp', firstNameNative: 'Άννα', lastNameNative: 'Δοκιμή',
      constituency: { slug: 'gr-electoral-athens-a' }, politicalAffiliations: [{ organization: { name: 'Test Party' } }] }],
    pagination: { totalPages: 1 },
  } } }));
  await page.goto('/');
  const section = page.getByRole('region', { name: 'What’s happening in your area', exact: true });
  await section.scrollIntoViewIfNeeded();
  const layers = section.getByRole('group', { name: 'Map content' });
  await layers.getByRole('button', { name: 'MPs', exact: true }).click();
  await expect(layers.getByRole('button', { name: 'MPs', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const districts = section.getByRole('list', { name: 'All electoral districts', exact: true });
  await expect(districts.getByRole('button')).toHaveCount(60);
  await expect(section.locator('path.leaflet-interactive')).toHaveCount(59);
  await districts.getByRole('button', { name: 'Α΄ Αθηνών 1 MP', exact: true }).click();
  await expect(section.getByRole('link', { name: 'Άννα Δοκιμή Test Party', exact: true })).toHaveAttribute('href', '/persons/test-athens-mp');
  await expect(section.getByRole('heading', { name: 'Α΄ Αθηνών', exact: true })).toBeVisible();
  await section.getByRole('button', { name: 'All Greece', exact: true }).click();
  // A real Leaflet feature event must select its electoral district.
  await section.locator('path.leaflet-interactive').first().dispatchEvent('click');
  await expect(section.getByRole('heading', { name: 'Αχαΐας', exact: true })).toBeVisible();
  const search = section.getByRole('searchbox', { name: 'Search a district, MP or party', exact: true });
  await search.fill('αννα');
  await expect(districts.getByRole('button')).toHaveCount(1);
  await districts.getByRole('button').click();
  await expect(section.getByRole('link', { name: 'Άννα Δοκιμή Test Party', exact: true })).toBeVisible();
  await expect(section.locator('.leaflet-zoom-anim')).toHaveCount(0);
  await expect.poll(async () => {
    const map = await section.locator('.leaflet-container').boundingBox();
    const selected = await section.locator('path[fill="#bc8868"]').boundingBox();
    if (!map || !selected || selected.width < 10 || selected.height < 10) return false;
    const x = selected.x + selected.width / 2, y = selected.y + selected.height / 2;
    return x >= map.x && x <= map.x + map.width && y >= map.y && y <= map.y + map.height;
  }).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await section.screenshot({ path: testInfo.outputPath('homepage-electoral-map.png') });
  await layers.getByRole('button', { name: 'Issues', exact: true }).click();
  await expect(section.getByRole('searchbox', { name: 'Search a municipality or area', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
