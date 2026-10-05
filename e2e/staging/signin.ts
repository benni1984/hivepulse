import type { Page } from '@playwright/test';

/**
 * Brings the email form into view on the login or register page.
 *
 * Sign-in with Apple or Google comes first and the email form sits behind a toggle whenever
 * a provider is configured, which staging has. The page decides that only once the server has
 * answered, so this waits for it to settle on one of the two layouts rather than looking once:
 * looking at once raced the lookup, and the form folded away under the test's feet.
 *
 * Conditional on purpose. With no provider there is no toggle, and a test that insisted on
 * one would fail for the wrong reason.
 */
export async function revealEmailForm(page: Page): Promise<void> {
  const toggle = page.getByTestId('email-signin-toggle');
  await toggle.or(page.locator('input[type="email"]')).first().waitFor({ timeout: 15_000 });
  if (await toggle.isVisible()) {
    await toggle.click();
  }
}
