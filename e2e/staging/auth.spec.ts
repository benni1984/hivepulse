import { test, expect } from '@playwright/test';

// All tests in this file start without pre-authenticated state.
test.use({ storageState: { cookies: [], origins: [] } });

test('login page renders and rejects wrong credentials', async ({ page }) => {
  await page.goto('/dashboard/login');
  await expect(page.locator('h1')).toContainText('Log in');

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
  await page.locator('input[type="email"]').fill('nobody@nowhere.invalid');
  await page.locator('input[type="password"]').fill('wrongpassword');
  await page.locator('button.dash-submit-btn').click();

  await expect(page.locator('.dash-error-banner')).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/\/dashboard\/login/);
});

test('register new account, verify dashboard access, then delete account', async ({ page }) => {
  const tag = Date.now();
  const name = `E2E User ${tag}`;
  const email = `e2e-${tag}@example.com`;
  const password = 'E2eTest1234!';

  await test.step('register', async () => {
    await page.goto('/dashboard/register');
    await expect(page.locator('h1')).toContainText('Create your account');
    await page.locator('input[type="text"]').fill(name);
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button.dash-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.dash-user-email')).toContainText(email);
  });

  await test.step('delete account', async () => {
    await page.goto('/dashboard/profile');
    await expect(page.locator('h1')).toContainText('Profile');
    await page.getByRole('button', { name: 'Delete My Account' }).click();
    await page.getByRole('button', { name: 'Yes, delete my account' }).click();
    await expect(page).toHaveURL(/\/dashboard\/login/, { timeout: 15_000 });
  });
});

test.describe('logout', () => {
  // Override to use the saved demo auth state just for this describe block.
  test.use({ storageState: '.auth/user.json' });

  test('logout redirects to login page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.dash-user-email')).toBeVisible({ timeout: 15_000 });
    await page.locator('button.dash-logout').click();
    await expect(page).toHaveURL(/\/dashboard\/login/, { timeout: 10_000 });
  });
});
