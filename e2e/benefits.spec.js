/* global document, window */
const { test, expect } = require('@playwright/test');
const { benefits } = require('../lib/benefits/catalog');
const { readFile } = require('node:fs/promises');

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'el', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => localStorage.setItem('appofa_country_entry_decision_v1', 'stay'));
});

for (const width of [390, 1280]) {
  test(`benefits guide filters, links deadlines and downloads reminders at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/citizen-help');
    const dismissCookies = page.getByRole('button', { name: 'Απόρριψη Μη Απαραίτητων', exact: true });
    if (await dismissCookies.isVisible()) await dismissCookies.click();
    await page.getByRole('link', { name: /^Επιδόματα Δικαιούχοι/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Επιδόματα & κοινωνικές παροχές');
    await expect(page.locator('article[id]')).toHaveCount(benefits.length);
    const search = page.getByLabel('Αναζήτηση επιδόματος ή δικαιούχου');
    await search.fill('θερμανσης');
    await expect(page.locator('article[id]')).toHaveCount(1);
    await expect(page.locator('#heating')).toBeVisible();
    await search.fill('αδυνατη-λεξη');
    await expect(page.getByText('Δεν βρέθηκε παροχή.', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Καθαρισμός φίλτρων' }).click();
    await page.getByLabel('Είδος παροχής', { exact: true }).selectOption('service');
    await expect(page.locator('article[id]')).toHaveCount(1);
    await page.goto('/citizen-help/benefits#birth');
    await expect(page.locator('#details-birth')).toHaveAttribute('open', '');
    await expect(page.locator('#birth')).toContainText('Εντός τριών μηνών');
    await page.locator('#birth').getByText('Προσθήκη στο προσωπικό ημερολόγιο (.ics)', { exact: true }).click();
    await page.locator('#birth input[type=date]').fill('2026-12-01');
    const pendingDownload = page.waitForEvent('download');
    await page.locator('#birth').getByRole('button', { name: 'Λήψη υπενθύμισης' }).click();
    const download = await pendingDownload;
    const content = (await readFile(await download.path(), 'utf8')).replace(/\r\n /g, '');
    expect(content).toContain('UID:benefit-birth-reminder-2026-12-01@appofa');
    expect(content).toContain('DTSTART;VALUE=DATE:20261201');
    expect(content).toContain('όχι επίσημη προθεσμία');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`benefits-${width}.png`) });
    await page.goto('/calendar?category=benefits&mode=list&period=month&month=2026-11');
    await expect(page.getByRole('link', { name: /Ειδικό εποχικό βοήθημα ΔΥΠΑ 2026/ })).toBeVisible();
    await page.getByRole('link', { name: /Ειδικό εποχικό βοήθημα ΔΥΠΑ 2026/ }).click();
    await expect(page).toHaveURL(/benefits#seasonal$/);
    await expect(page.locator('#details-seasonal')).toHaveAttribute('open', '');
  });
}
