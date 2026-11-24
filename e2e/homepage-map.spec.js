/* global document, window */
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => {
    localStorage.setItem('appofa_country_entry_decision_v1', 'stay');
    localStorage.setItem('gdpr_consent', JSON.stringify({ necessary: true, analytics: false, functional: false, timestamp: Date.now() }));
  });
});

test('homepage local map widget opens the shared political layer with its selected district', async ({ page }, testInfo) => {
  await page.route('**/api/persons?**', route => route.fulfill({ json: { success: true, data: {
    profiles: [{ id: 1001, slug: 'test-athens-mp', firstNameNative: 'Anna', lastNameNative: 'Example', constituency: { slug: 'gr-electoral-athens-a' } }], pagination: { totalPages: 1 },
  } } }));
  await page.route('**/api/electoral-districts/candidates?**', route => route.fulfill({ json: { success: true, data: {
    registrations: [{ id: 501, districtId: 'district-athens-a', electionCycle: '2027', partyName: 'Community party', slogan: 'Listen to residents', consultationCommitment: 'I will consult residents monthly and publish my responses.', candidate: { firstNameNative: 'Maria', lastNameNative: 'Example', username: 'maria-example' } }], pagination: { totalPages: 1 },
  } } }));
  await page.goto('/');
  const section = page.getByRole('region', { name: 'Political map', exact: true });
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole('group', { name: 'Map content' })).toHaveCount(0);
  await expect(section.getByText('Find your district', { exact: true })).toBeVisible();
  await section.getByRole('combobox', { name: 'Choose an electoral district', exact: true }).selectOption('district-athens-a');
  await expect(section.getByRole('link', { name: 'Meet MP Anna Example', exact: true })).toBeVisible();
  await expect(section.getByRole('link', { name: 'Meet candidate Maria Example', exact: true })).toBeVisible();
  await section.locator('summary').filter({ hasText: 'Consultation plan shared' }).click();
  await expect(section.getByText('Candidate statement', { exact: true })).toBeVisible();
  await expect(section.getByText('I will consult residents monthly and publish my responses.', { exact: true })).toBeVisible();
  if (testInfo.project.name === 'mobile') {
    const toggle = section.getByRole('button', { name: 'Show district map', exact: true });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(section.getByRole('region', { name: 'Find your electoral district on the map' })).toHaveCount(0);
    await toggle.click();
    await expect(section.getByRole('region', { name: 'Find your electoral district on the map' })).toBeVisible();
    await section.getByRole('button', { name: 'Hide district map', exact: true }).click();
  }
  await section.screenshot({ path: testInfo.outputPath('political-widget-people-first.png') });
  await section.getByRole('link', { name: 'Explore your district', exact: false }).click();
  await expect(page).toHaveURL(/\/map\?layer=political&district=district-athens-a/);
  await expect(page.getByRole('heading', { name: 'Explore the map', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Anna Example Independent', exact: true })).toBeVisible();
});

test('homepage local map keeps the layout fixed across layers and candidate filters', async ({ page }, testInfo) => {
  await page.route('**/api/electoral-districts/candidates?**', route => route.fulfill({ json: { success: true, data: {
    registrations: [
      { id: 501, districtId: 'district-athens-a', electionCycle: '2027', partyName: 'Community party', slogan: 'Listen to residents', platform: 'Consult residents on local projects.', candidate: { firstNameNative: 'Maria', lastNameNative: 'Example' } },
      { id: 502, districtId: 'district-athens-a', electionCycle: '2023', candidate: { firstNameNative: 'Past campaign' } },
    ], pagination: { totalPages: 1 },
  } } }));
  await page.goto('/map?layer=political&district=district-athens-a');
  const section = page.getByRole('region', { name: 'Explore the map', exact: true });
  const layout = () => section.locator('.home-map').evaluate(frame => {
    const elements = [frame, frame.querySelector('[type="search"]'), frame.querySelector('.leaflet-container'), frame.querySelector('aside'), frame.lastElementChild];
    if (!elements.every(Boolean)) return null;

    const origin = frame.getBoundingClientRect();
    return elements.map(element => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return [x - origin.x, y - origin.y, width, height].map(Math.round);
    });
  });
  let initialLayout;
  await expect.poll(async () => {
    initialLayout = await layout();
    return initialLayout;
  }).not.toBeNull();
  const electoral = section.getByRole('complementary', { name: 'People by electoral district' });
  await electoral.getByRole('button', { name: 'Candidates', exact: true }).click();
  await expect(page.locator('a[href^="/candidate-registrations/"]')).toHaveCount(2);
  await electoral.getByRole('combobox', { name: 'Election cycle', exact: true }).selectOption('2027');
  await expect(page.locator('a[href^="/candidate-registrations/"]')).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Maria Example/ })).toContainText('Consult residents on local projects.');
  const aboutCandidates = electoral.locator('summary').filter({ hasText: 'About these candidates' });
  await aboutCandidates.click();
  await expect(electoral.getByText(/Approved parliamentary registrations/)).toBeVisible();
  await expect.poll(layout).toEqual(initialLayout);
  await aboutCandidates.click();
  await section.screenshot({ path: testInfo.outputPath('political-map-candidates.png') });
  const layers = section.getByRole('group', { name: 'Map content', exact: true });
  for (const [label, value] of [['Cameras', 'cameras'], ['Live streams', 'live'], ['News', 'news'], ['Issues', 'issues'], ['Votes', 'polls']]) {
    await layers.getByRole('button', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`layer=${value}$`));
    await expect(layers.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(section.getByRole('region', { name: /^Local activity map:/ })).toBeVisible();
    await expect.poll(layout).toEqual(initialLayout);
  }
  if (testInfo.project.name === 'mobile') {
    await section.getByRole('button', { name: 'Collapse results' }).click();
  }
  await layers.getByRole('button', { name: 'Political map', exact: true }).click();
  await expect(page).toHaveURL(/layer=political&district=district-athens-a$/);
  if (testInfo.project.name === 'mobile') {
    await expect(section.getByRole('button', { name: 'Show results' })).toHaveAttribute('aria-expanded', 'false');
    await section.getByRole('button', { name: 'Show results' }).click();
  }
  await expect.poll(layout).toEqual(initialLayout);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('homepage local map keeps background tiles visible after expanding and closing', async ({ page }, testInfo) => {
  // Keep the rendering check independent of the tile provider's network status.
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><path fill="#cbd5e1" d="M0 0h256v256H0z"/></svg>',
  }));
  await page.goto('/map?layer=issues');
  const section = page.getByRole('region', { name: 'Explore the map', exact: true });
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
  await page.goto('/map?layer=issues');
  const section = page.getByRole('region', { name: 'Explore the map', exact: true });
  await section.scrollIntoViewIfNeeded();
  const areas = section.getByRole('list', { name: 'Explore areas', exact: true });
  await expect(areas.getByRole('button', { name: /Attica/ })).toBeVisible();
  await expect(section.locator('.home-map-count')).toHaveCount(1);
  await areas.getByRole('button', { name: /Attica/ }).click();
  await expect(section.getByRole('heading', { name: 'Broken light on Oak Street', exact: true })).toBeVisible();
  // Reporting journeys may already have added public issues to this shared area.
  await expect.poll(() => section.locator('.map-issue-marker').count()).toBeGreaterThanOrEqual(2);
  const search = section.getByRole('searchbox', { name: 'Search a municipality or area' });
  const mapOffset = () => section.locator('.leaflet-container').evaluate(map =>
    map.getBoundingClientRect().top - map.closest('.home-map').getBoundingClientRect().top);
  const initialMapOffset = await mapOffset();
  await search.fill('Test Municipality');
  const result = section.locator('#home-map-search-results').getByRole('button', { name: /Test Municipality/ });
  await expect(result).toBeVisible();
  expect(await mapOffset()).toBe(initialMapOffset);
  await search.press('Escape');
  await expect(result).toHaveCount(0);
  await search.fill('Test Municip');
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
  await page.goto('/map?layer=issues');
  const section = page.getByRole('region', { name: labels.pageTitle, exact: true });
  await section.scrollIntoViewIfNeeded();
  const boundaries = page.waitForResponse(response => new URL(response.url()).pathname === '/api/electoral-districts');
  await section.getByRole('button', { name: labels.political, exact: true }).click();
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
  await page.goto('/map?layer=issues');
  const section = page.getByRole('region', { name: 'Explore the map', exact: true });
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
  await page.goto('/map?layer=issues');
  const section = page.getByRole('region', { name: 'Explore the map', exact: true });
  await section.scrollIntoViewIfNeeded();
  const layers = section.getByRole('group', { name: 'Map content' });
  await layers.getByRole('button', { name: 'Political map', exact: true }).click();
  await expect(layers.getByRole('button', { name: 'Political map', exact: true })).toHaveAttribute('aria-pressed', 'true');
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
  const search = section.getByRole('searchbox', { name: 'Search a district, person or party', exact: true });
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
