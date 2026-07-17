import { test, expect } from '@playwright/test';

// Runs only in the 'mobile' Playwright project (devices['iPhone 13']) --
// see playwright.staging.config.ts. Regression coverage for the dashboard
// sidebar nav being unreachable on mobile (.dash-nav/.dash-user were
// `display:none` below 768px with no toggle to reveal them).

test('dashboard sidebar nav is hidden by default and reachable via the mobile toggle', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  const sidebar = page.locator('.dash-sidebar');
  await expect(sidebar).not.toHaveClass(/mobile-open/);
  await expect(page.locator('.dash-nav')).not.toBeVisible();

  await page.locator('.dash-mobile-toggle').click();
  await expect(sidebar).toHaveClass(/mobile-open/);
  await expect(page.locator('.dash-nav')).toBeVisible();
  await expect(page.locator('.dash-nav-link', { hasText: 'Profile' })).toBeVisible();
});

test('tapping a nav link on mobile navigates and closes the menu', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

  await page.locator('.dash-mobile-toggle').click();
  await page.locator('.dash-nav-link', { hasText: 'Profile' }).click();

  await expect(page).toHaveURL(/\/dashboard\/profile$/);
  await expect(page.locator('.dash-sidebar')).not.toHaveClass(/mobile-open/);
});
