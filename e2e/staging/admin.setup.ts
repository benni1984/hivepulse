import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_FILE = '.auth/admin.json';

setup('authenticate as admin user', async ({ page, request }) => {
  const email = process.env.STAGING_ADMIN_EMAIL ?? 'muellerbenjamin110@gmail.com';
  const password = (process.env.STAGING_ADMIN_PASSWORD!).trim();
  const ciToken = process.env.CI_SETUP_TOKEN;

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // If a CI setup token is available, use it to create/reset the admin account
  // so the password always matches the secret regardless of prior DB state.
  if (ciToken) {
    await request.post('/api/v1/auth/ci-setup', {
      data: { email, password, token: ciToken, name: 'Admin' },
      failOnStatusCode: true,
    });
  }

  await page.goto('/dashboard/login');
  // Sign-in with Apple or Google now comes first, and the email form sits behind this
  // toggle whenever a provider is configured. Conditional on purpose: the toggle is absent
  // when none is, and a test that insisted on it would fail for the wrong reason.
  const emailToggle = page.getByTestId('email-signin-toggle');
  // Wait for the page to settle on one of the two layouts. Looking at once raced the
  // provider lookup: the form was briefly visible, so nothing was clicked, and then it folded
  // away behind the toggle under the test's feet.
  await emailToggle.or(page.locator('input[type="email"]')).first().waitFor({ timeout: 15_000 });
  if (await emailToggle.isVisible()) {
    await emailToggle.click();
  }
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button.dash-submit-btn').click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
