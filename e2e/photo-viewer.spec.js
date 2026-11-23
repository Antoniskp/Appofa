const { test, expect } = require('@playwright/test');
const sharp = require('sharp');
const en = require('../messages/en.json');

const avatar = '/uploads/profiles/photo-viewer-test.webp';
const locationPhoto = '/uploads/locations/photo-viewer-test.webp';
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
