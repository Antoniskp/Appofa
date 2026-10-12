const { test, expect } = require('@playwright/test');
const auth = require('../messages/en.json').auth;

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
  await page.getByLabel('Τίτλος', { exact: true }).fill(title);
  await page.getByLabel('Περιγραφή', { exact: true }).fill('Meet at the town square to clean the park.');
  await page.getByLabel('Έναρξη', { exact: true }).fill('2026-10-20T10:00');
  await page.getByLabel('Λήξη', { exact: true }).fill('2026-10-20T12:00');
  await page.getByLabel('Χώρος / διεύθυνση', { exact: true }).fill('Town square');
  await page.getByRole('button', { name: 'Αποθήκευση εκδήλωσης' }).click();
  await expect(page).toHaveURL(/\/events\/\d+$/);
  const detailUrl = page.url();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('Δημοσιευμένη', { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Προσθήκη στο ημερολόγιο (.ics)' }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/event-\d+\.ics/);
  await page.goto('/locations/test-municipality?tab=events');
  await page.getByLabel('Μήνας', { exact: true }).fill('2026-10');
  await expect(page.getByRole('link').filter({ hasText: title })).toBeVisible();
  await page.getByLabel('Προβολή ημερολογίου').selectOption('month');
  await expect(page.getByRole('link').filter({ hasText: title })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('location-calendar.png'), fullPage: true });
  await page.goto('/calendar');
  await page.getByLabel('Μήνας', { exact: true }).fill('2026-10');
  await expect(page.getByRole('link').filter({ hasText: title })).toBeVisible();
  await page.goto(detailUrl);
  await page.getByRole('button', { name: 'Ακύρωση εκδήλωσης', exact: true }).click();
  await expect(page.getByText('Ακυρώθηκε', { exact: true })).toBeVisible();
});
