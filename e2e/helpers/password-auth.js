const { expect } = require('@playwright/test');
const { auth } = require('../../messages/en.json');

async function openPasswordForm(page, summary) {
  const main = page.getByRole('main');
  const form = main.locator('form[data-auth-form="password"]');
  if (!(await form.isVisible())) {
    await main.getByText(summary, { exact: true }).click();
  }
  await expect(form).toBeVisible();
  return form;
}

async function submitPasswordLogin(page, email) {
  const form = await openPasswordForm(page, auth.use_password_instead);
  await form.locator('[name="email"]').fill(email);
  await form.locator('[name="password"]').fill('TestPassword123!');
  await form.getByRole('button', { name: auth.submit_login, exact: true }).click();
}

module.exports = { openPasswordForm, submitPasswordLogin };
