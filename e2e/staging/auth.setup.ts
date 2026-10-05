import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_FILE = '.auth/user.json';

setup('authenticate as demo user', async ({ page, request }) => {
  const email = process.env.STAGING_DEMO_EMAIL ?? 'demo@HivePulse.dev';
  const password = process.env.STAGING_DEMO_PASSWORD ?? 'Demo1234!';

  // Ensure the demo account exists — silently no-ops if already registered.
  await request.post('/api/v1/auth/register', {
    data: { email, password, name: 'Demo Beekeeper' },
    failOnStatusCode: false,
  });

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto('/dashboard/login');
  // Sign-in with Apple or Google now comes first, and the email form sits behind this
  // toggle whenever a provider is configured. Conditional on purpose: the toggle is absent
  // when none is, and a test that insisted on it would fail for the wrong reason.
  const emailToggle = page.getByTestId('email-signin-toggle');
  if (await emailToggle.isVisible().catch(() => false)) {
    await emailToggle.click();
  }
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button.dash-submit-btn').click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
