const { test, expect } = require('@playwright/test');
const sharp = require('sharp');
const en = require('../messages/en.json');

const avatar = '/uploads/profiles/photo-viewer-test.webp';
const locationPhoto = '/uploads/locations/photo-viewer-test.webp';
const suggestionPhoto = '/uploads/media/photo-viewer-test.webp';
const updatedAt = '2026-01-01T12:00:00.000Z';
const version = Date.parse(updatedAt);

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => {
    localStorage.setItem('appofa_country_entry_decision_v1', 'stay');
    localStorage.setItem('gdpr_consent', JSON.stringify({ necessary: true, analytics: false, functional: false }));
  });
  const photo = await sharp({ create: { width: 512, height: 320, channels: 3, background: '#246c9f' } }).webp().toBuffer();
  await page.route('**/uploads/**/photo-viewer-test.webp*', route => route.fulfill({ contentType: 'image/webp', body: photo }));
});

test('uploaded avatar previews before selection and opens larger on profile pages', async ({ page }) => {
  const login = await page.request.post('/api/auth/login', {
    data: { email: 'contributor@example.test', password: 'TestPassword123!' },
  });
  expect(login.ok()).toBe(true);

  let profile;
  let activeAvatar = '';
  await page.route('**/api/auth/profile', async route => {
    const response = await route.fetch();
    const json = await response.json();
    profile = { ...json.data.user, avatar: activeAvatar, avatarUrl: avatar, avatarUpdatedAt: updatedAt };
    await route.fulfill({ response, json: { ...json, data: { user: profile } } });
  });
  await page.route('**/api/auth/avatar-source', route => {
    expect(route.request().postDataJSON()).toEqual({ source: 'upload' });
    activeAvatar = avatar;
    return route.fulfill({ json: { success: true, data: { user: { ...profile, avatar } } } });
  });

  await page.goto('/profile#settings');
  const upload = page.getByRole('button', { name: /Uploaded.*Use this avatar/ });
  const preview = upload.getByRole('img');
  await expect(preview).toHaveJSProperty('src', new URL(`${avatar}?v=${version}`, page.url()).href);
  await expect(preview).toHaveJSProperty('naturalWidth', 512);
  await upload.click();
  await expect(page.getByRole('button', { name: /Uploaded.*Currently active avatar/ })).toBeDisabled();

  await page.goto('/profile');
  const label = 'View larger photo of e2e-contributor';
  const openPhoto = page.getByRole('button', { name: label, exact: true });
  await openPhoto.focus();
  await openPhoto.press('Enter');
  const viewer = page.getByRole('dialog', { name: label });
  const photo = viewer.getByRole('img');
  await expect(photo).toHaveJSProperty('naturalWidth', 512);
  expect((await photo.boundingBox()).width).toBeGreaterThan((await openPhoto.boundingBox()).width);
  await page.keyboard.press('Escape');
  await expect(viewer).toBeHidden();
  await expect(openPhoto).toBeFocused();

  await page.route('**/api/auth/users/username/e2e-contributor/public', async route => {
    const response = await route.fetch();
    const json = await response.json();
    await route.fulfill({ response, json: { ...json, data: { user: { ...json.data.user, avatar } } } });
  });
  await page.goto('/users/e2e-contributor');
  await openPhoto.click();
  await expect(photo).toHaveJSProperty('naturalWidth', 512);
  await viewer.getByRole('button', { name: en.common.photoViewer.close }).click();
  await expect(viewer).toBeHidden();
});

test('guests can enlarge a public person portrait from the directory and profile', async ({ page }) => {
  const profile = { id: 501, slug: 'public-person', firstNameNative: 'Public', lastNameNative: 'Person', claimStatus: 'unclaimed', photo: avatar };
  await page.route('**/api/persons?*', route => route.fulfill({ json: { success: true, data: { profiles: [profile] } } }));
  await page.route('**/api/persons/public-person', route => route.fulfill({ json: { success: true, data: { profile } } }));

  await page.goto('/users');
  const label = 'View larger photo of Public Person';
  const openPhoto = page.getByRole('button', { name: label });
  const viewer = page.getByRole('dialog', { name: label });
  await openPhoto.click();
  await expect(viewer.getByRole('img')).toHaveJSProperty('naturalWidth', 512);
  await expect(page).toHaveURL(/\/users$/);
  await page.keyboard.press('Escape');
  await expect(openPhoto).toBeFocused();
  await page.getByRole('link', { name: 'Public Person', exact: true }).click();
  await expect(page).toHaveURL(/\/persons\/public-person$/);
  await openPhoto.click();
  await expect(viewer.getByRole('img')).toHaveJSProperty('naturalWidth', 512);
});

test('suggestion photos open in the same popup from cards and detail pages', async ({ page }) => {
  const photos = [
    { id: 1, url: suggestionPhoto, kind: 'report', caption: 'Street light before repair' },
    { id: 2, url: `${suggestionPhoto}?repair=1`, kind: 'repair', caption: 'Street light after repair' },
  ];
  await page.route('**/api/suggestions?*', async route => {
    const response = await route.fetch();
    const json = await response.json();
    await route.fulfill({ response, json: { ...json, data: json.data.map(item => item.id === 1 ? { ...item, photos } : item) } });
  });
  await page.route('**/api/suggestions/1', async route => {
    const response = await route.fetch();
    const json = await response.json();
    await route.fulfill({ response, json: { ...json, data: { ...json.data, photos } } });
  });

  await page.goto('/suggestions');
  const reportPhoto = page.getByRole('button', { name: 'View larger photo of Street light before repair' });
  await reportPhoto.click();
  await expect(page.getByRole('dialog').getByRole('img')).toHaveJSProperty('naturalWidth', 512);
  await expect(page).toHaveURL(/\/suggestions$/);
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: /Broken light on Oak Street/ }).click();
  await expect(page).toHaveURL(/\/suggestions\/1$/);
  const repairPhoto = page.getByRole('button', { name: 'View larger photo of Street light after repair' });
  await repairPhoto.click();
  const viewer = page.getByRole('dialog', { name: 'View larger photo of Street light after repair' });
  await expect(viewer.getByRole('img')).toHaveJSProperty('src', new URL(photos[1].url, page.url()).href);
  await viewer.getByRole('button', { name: en.common.photoViewer.close }).click();
  await expect(repairPhoto).toBeFocused();
});

test('article photos open in the viewer and linked images retain their links', async ({ page }) => {
  const article = {
    id: 900,
    title: 'Article with photos',
    type: 'analysis',
    status: 'published',
    bannerImageUrl: suggestionPhoto,
    bannerImageAltText: 'Article cover',
    content: `![Street scene](${suggestionPhoto})\n\n[![Linked street scene](${suggestionPhoto})](/locations/test-municipality)`,
  };
  await page.route('**/api/articles/900', route => route.fulfill({ json: { success: true, data: { article } } }));
  await page.goto('/articles/900-article-with-photos');

  for (const name of ['Article cover', 'Street scene']) {
    await page.getByRole('button', { name: `View larger photo of ${name}` }).click();
    await expect(page.getByRole('dialog').getByRole('img')).toHaveJSProperty('naturalWidth', 512);
    await page.keyboard.press('Escape');
  }
  const linkedPhoto = page.getByRole('link', { name: 'Linked street scene' });
  await expect(linkedPhoto).toHaveAttribute('href', '/locations/test-municipality');
  await expect(linkedPhoto.getByRole('button')).toHaveCount(0);
});

test('viewing a poll option photo does not select the option', async ({ page }) => {
  await page.route('**/api/polls/1', async route => {
    const response = await route.fetch();
    const json = await response.json();
    const options = json.data.options.map(option => ({ ...option, photoUrl: suggestionPhoto }));
    await route.fulfill({ response, json: { ...json, data: { ...json.data, type: 'complex', options } } });
  });
  await page.goto('/polls/1-improve-our-local-park');

  const submitVote = page.getByRole('button', { name: 'Υποβολή Ψήφου' });
  await expect(submitVote).toBeDisabled();
  await page.getByRole('button', { name: 'View larger photo of More trees' }).click();
  await expect(page.getByRole('dialog').getByRole('img')).toHaveJSProperty('naturalWidth', 512);
  await page.keyboard.press('Escape');
  await expect(submitVote).toBeDisabled();
  await page.getByRole('heading', { name: 'More trees' }).click();
  await expect(submitVote).toBeEnabled();
});

test.describe('touch viewport', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('location photo opens on tap and fits within the screen', async ({ page }) => {
    await page.route('**/api/locations/test-municipality', async route => {
      const response = await route.fetch();
      const json = await response.json();
      await route.fulfill({ response, json: { ...json, location: { ...json.location, imageUrl: locationPhoto, imageUpdatedAt: updatedAt } } });
    });

    await page.goto('/locations/test-municipality');
    const label = 'View larger photo of Test Municipality';
    const opener = page.getByRole('button', { name: label });
    await opener.tap();
    const viewer = page.getByRole('dialog', { name: label });
    const photo = viewer.getByRole('img');
    await expect(photo).toHaveJSProperty('src', new URL(`${locationPhoto}?v=${version}`, page.url()).href);
    await expect(photo).toHaveJSProperty('naturalWidth', 512);
    const box = await photo.boundingBox();
    expect(box.width).toBeGreaterThan((await opener.boundingBox()).width);
    expect(box.width).toBeLessThan(page.viewportSize().width);
    expect(box.width / box.height).toBeCloseTo(512 / 320);
    await viewer.getByRole('button', { name: en.common.photoViewer.close }).tap();
    await expect(viewer).toBeHidden();
  });
});
