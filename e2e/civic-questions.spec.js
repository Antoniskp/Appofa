const { test, expect } = require('@playwright/test');
const el = require('../messages/el.json').civicQuestions;

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'el', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => {
    localStorage.setItem('appofa_country_entry_decision_v1', 'stay');
    localStorage.setItem('gdpr_consent', JSON.stringify({ necessary: true, analytics: false, functional: false, timestamp: new Date().toISOString() }));
  });
});

for (const width of [390, 1440]) {
  test(`parliament topics support discovery and clear participation at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/civic-questions');
    await expect(page.getByRole('heading', { name: el.list.title, exact: true })).toBeVisible();
    const energyTitle = 'Συμφωνείτε με τις αλλαγές στην αγορά ηλεκτρικής ενέργειας και την προστασία των καταναλωτών;';
    const energy = page.getByRole('link', { name: energyTitle, exact: true });
    await expect(energy).toBeVisible();
    // Visitors can see the first topic before scrolling past onboarding copy.
    expect((await page.locator('a[aria-labelledby^="civic-question-"]').first().boundingBox()).y).toBeLessThan(600);
    await expect(page.getByText(el.featured.empty)).toHaveCount(0);
    await expect(page.getByRole('button', { name: el.list.filters, exact: true })).toHaveText(el.list.filters);
    await expect(page.getByRole('button', { name: el.list.clear, exact: true })).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: el.list.sort, exact: true })).toBeVisible();
    await page.getByRole('button', { name: el.list.filters, exact: true }).click();
    await page.getByRole('combobox', { name: el.form.category, exact: true }).selectOption('Ενέργεια');
    await expect(energy).toBeVisible();
    await expect(page.getByRole('link', { name: 'Συμφωνείτε με τις φορολογικές και κοινωνικές ρυθμίσεις για εισόδημα, αποταμίευση και επενδύσεις;', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: el.list.all, exact: true }).click();
    await expect(page.getByRole('link', { name: 'Συμφωνείτε με το προηγούμενο προσχέδιο προϋπολογισμού;', exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: el.form.category, exact: true })).toHaveValue('');
    await page.getByRole('button', { name: el.list.open, exact: true }).click();
    await page.getByRole('button', { name: el.list.filters, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`parliament-topics-${width}.png`) });
    await energy.click();
    await expect(page.getByRole('region', { name: el.detail.vote, exact: true }).getByText(energyTitle, { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: el.detail.login_vote, exact: true })).toBeVisible();
    // Closing-soon topics still offer their ballot after sign-in.
    const login = await page.request.post('/api/auth/login', { data: { email: 'author@example.test', password: 'TestPassword123!' } });
    expect(login.ok()).toBe(true);
    await page.reload();
    await expect(page.getByRole('button', { name: el.choices.agree, exact: true })).toBeVisible();
  });
}
