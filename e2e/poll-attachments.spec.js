const { test, expect } = require('@playwright/test');
const sharp = require('sharp');

test('poll attachments upload, preview, edit and respect visibility on desktop and mobile', async ({ page, context, playwright }, testInfo) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'el', domain: '127.0.0.1', path: '/' }]);
  await context.addInitScript(() => localStorage.setItem('appofa_country_entry_decision_v1', 'stay'));
  const login = await page.request.post('/api/auth/login', { data: { email: 'author@example.test', password: 'TestPassword123!' } });
  expect(login.ok()).toBe(true);
  const csrf = (await context.cookies()).find(cookie => cookie.name === 'csrf_token').value;
  const headers = { 'x-csrf-token': csrf };
  const photo = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#548f78' } }).png().toBuffer();
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n');
  // Exercise the 20 MiB boundary through Next's actual binary API proxy.
  const largePdf = Buffer.alloc(20 * 1024 * 1024, 32);
  largePdf.write('%PDF-1.4\n');
  largePdf.write('%%EOF\n', largePdf.length - 6);
  const largeResponse = await page.request.post('/api/polls/attachments', { headers, multipart: { file: { name: 'large-plan.pdf', mimeType: 'application/pdf', buffer: largePdf } } });
  expect(largeResponse.status(), await largeResponse.text()).toBe(201);
  const large = (await largeResponse.json()).attachment;
  expect((await page.request.delete(`/api/polls/attachments/${large.id}`, { headers })).ok()).toBe(true);

  await page.goto('/polls/create');
  const cookieDismiss = page.getByRole('button', { name: 'Απόρριψη Μη Απαραίτητων', exact: true });
  if (await cookieDismiss.isVisible()) await cookieDismiss.click();
  await page.locator('[name=title]').fill('Improve the park with supporting documents');
  await page.locator('textarea[name=description]').fill('Review the photos and proposal before voting.');
  await page.locator('[name=type]').selectOption('binary');
  await page.locator('input[type=file]').setInputFiles([
    { name: 'park.png', mimeType: 'image/png', buffer: photo },
    { name: 'proposal.pdf', mimeType: 'application/pdf', buffer: pdf },
  ]);
  await expect(page.getByText('2 από 10 συνημμένα', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Τίτλος αρχείου 1', exact: true }).fill('Park today');
  await page.getByRole('textbox', { name: 'Λεζάντα 1 (προαιρετικό)', exact: true }).fill('Current park layout');
  await page.getByRole('textbox', { name: 'Τίτλος αρχείου 2', exact: true }).fill('Proposed improvements');
  const editor = page.locator('section').filter({ has: page.getByRole('heading', { name: /Φωτογραφίες & έγγραφα/ }) });
  await editor.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('attachments-editor-desktop.png'), fullPage: true });
  const creation = page.waitForResponse(response => /\/api\/polls$/.test(response.url()) && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Δημιουργία Δημοσκόπησης', exact: true }).click();
  const createdResponse = await creation;
  expect(createdResponse.status()).toBe(201);
  const poll = (await createdResponse.json()).data;
  await expect(page).toHaveURL(new RegExp(`/polls/${poll.id}`));
  const gallery = page.getByRole('region', { name: 'Φωτογραφίες και έγγραφα δημοσκόπησης' });
  await expect(gallery.getByText('Current park layout')).toBeVisible();
  await gallery.getByRole('button', { name: 'Μεγέθυνση: Park today' }).click();
  await expect(page.getByRole('dialog', { name: 'Park today' })).toBeVisible();
  await page.getByRole('button', { name: 'Κλείσιμο', exact: true }).click();
  await expect(gallery.locator('dialog')).not.toBeVisible();
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await gallery.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`attachments-view-${viewport.width}.png`), fullPage: true });
  }
  await page.goto(`/polls/${poll.id}/edit`);
  await page.getByRole('button', { name: 'Μετακίνηση συνημμένου 1 κάτω', exact: true }).click();
  await page.getByRole('textbox', { name: 'Λεζάντα 1 (προαιρετικό)', exact: true }).fill('Read this proposal');
  await page.locator('[name=visibility]').selectOption('private');
  await page.getByRole('button', { name: 'Αποθήκευση Αλλαγών', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/polls/${poll.id}[^/]*$`));
  const updated = (await (await page.request.get(`/api/polls/${poll.id}`)).json()).data;
  expect(updated.attachments[0].title).toBe('Proposed improvements');
  expect(updated.attachments[0].caption).toBe('Read this proposal');
  const anonymous = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL });
  try {
    expect((await anonymous.get(poll.attachments[0].url)).status()).toBe(403);
    expect((await anonymous.get(poll.attachments[0].thumbnailUrl)).status()).toBe(403);
    const optimized = await anonymous.get(`/_next/image?url=${encodeURIComponent(poll.attachments[0].url)}&w=640&q=75`);
    expect(optimized.status()).toBe(400);
  } finally {
    await anonymous.dispose();
    await page.request.delete(`/api/polls/${poll.id}`, { headers });
  }
});
