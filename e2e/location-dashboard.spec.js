const { test, expect } = require('@playwright/test');

test('location dashboard provides useful routes and a scoped agenda', async ({ page, context }, testInfo) => {
  await context.addInitScript(() => localStorage.setItem('appofa_country_entry_decision_v1', 'stay'));
  await page.route('**/api/calendar?**', route => route.fulfill({ json: { success: true, data: [
    { id: 'event-1', title: 'Neighbourhood gathering', start: '2026-10-25T10:00:00Z', timezone: 'Europe/Athens', href: '/events/1', status: 'published' },
  ] } }));
  await page.goto('/locations/test-municipality');
  const dashboard = page.getByRole('region', { name: 'Η περιοχή με μια ματιά' });
  await expect(dashboard.getByText('Neighbourhood gathering')).toBeVisible();
  await expect(dashboard.getByRole('link', { name: /Κάμερες/ })).toHaveAttribute('href', '/locations/test-municipality/improve');
  await page.screenshot({ path: testInfo.outputPath('location-dashboard.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await dashboard.getByRole('link', { name: /Κοινότητα/ }).click();
  await expect(page.locator('#tab-users')).toHaveAttribute('aria-selected', 'true');
  await dashboard.getByRole('link', { name: 'Όλο το ημερολόγιο' }).click();
  await expect(page.locator('#tab-events')).toHaveAttribute('aria-selected', 'true');
});

test('agenda distinguishes failures from an empty calendar and supports retry', async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem('appofa_country_entry_decision_v1', 'stay'));
  let failing = true;
  await page.route('**/api/calendar?**', route => route.fulfill(failing
    ? { status: 503, json: { success: false, message: 'Unavailable' } }
    : { json: { success: true, data: [] } }));
  await page.goto('/locations/test-municipality');
  const dashboard = page.getByRole('region', { name: 'Η περιοχή με μια ματιά' });
  await expect(dashboard.getByText('Το ημερολόγιο δεν είναι διαθέσιμο αυτή τη στιγμή.')).toBeVisible();
  failing = false;
  await dashboard.getByRole('button', { name: 'Δοκίμασε ξανά' }).click();
  await expect(dashboard.getByRole('link', { name: 'Πρότεινε εκδήλωση →' })).toHaveAttribute('href', '/events/new?locationId=3');
});
