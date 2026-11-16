import { test, expect } from '@playwright/test';

test('create, edit, and delete an inspection', async ({ page }) => {
  const tag = Date.now();
  const apiaryName = `e2e-apiary-${tag}`;
  const hiveName = `e2e-hive-${tag}`;

  await test.step('set up: create apiary and hive', async () => {
    await page.goto('/dashboard');
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
    await page.locator('button.dash-new-btn').click();
    await page.locator('#apiary-create-name').fill(apiaryName);
    await page.locator('button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });

    await page.locator('.dash-apiary-card', { hasText: apiaryName }).click();
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });

    await page.locator('button.dash-new-btn', { hasText: 'New Hive' }).click();
    await page.locator('#hive-create-name').fill(hiveName);
    await page.locator('.dash-inline-form button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });

    await page.locator('.dash-hive-card', { hasText: hiveName }).click();
    await expect(page.locator('.spinner')).not.toBeVisible({ timeout: 15_000 });
  });

  await test.step('create inspection', async () => {
    await page.locator('button.dash-new-btn', { hasText: 'New Inspection' }).click();
    const form = page.locator('.dash-inline-form');
    await expect(form).toBeVisible();
    await expect(form.locator('h2')).toContainText('Log Inspection');

    // Date is pre-filled with today. Every field is addressed by its id rather than by
    // its position or its shape: this step used to say input[type="number"][max="10"], which
    // meant brood frames only for as long as it was the sole 0-10 number in the form. Honey
    // frames arrived with the same bounds and Playwright found two (#447).
    await form.locator('#inspection-varroa').selectOption('1');     // low
    await form.locator('#inspection-mood').selectOption('calm');
    await form.locator('#inspection-queen').selectOption('true');
    await form.locator('#inspection-brood').fill('5');
    // The four fields #447 added to the website, none of which had any end-to-end cover.
    await form.locator('#inspection-honey').fill('3');
    await form.locator('#inspection-weight').fill('24.5');
    await form.locator('#inspection-treatment').fill('e2e formic acid');
    await form.locator('#inspection-notes').fill('e2e notes');

    await form.locator('button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('table.dash-inspection-table')).toBeVisible();
  });

  await test.step('edit inspection', async () => {
    await page.locator('button.dash-row-btn', { hasText: 'Edit' }).first().click();
    const form = page.locator('.dash-inline-form');
    await expect(form.locator('h2')).toContainText('Edit Inspection');

    // Update varroa level from low → high
    await form.locator('#inspection-varroa').selectOption('3');

    await form.locator('button.dash-submit-btn').click();
    await expect(page.locator('.dash-success-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('table.dash-inspection-table td', { hasText: /^High$/ })).toBeVisible();
  });

  await test.step('delete inspection', async () => {
    await page.locator('button.dash-row-btn-danger', { hasText: 'Delete' }).first().click();
    await page.locator('button.dash-row-btn-danger', { hasText: 'Confirm' }).click();
    await expect(page.locator('table.dash-inspection-table')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('p.dash-empty', { hasText: 'No inspections yet' })).toBeVisible();
  });

  await test.step('clean up: delete hive and apiary', async () => {
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Delete Hive' }).click();
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Confirm Delete' }).click();
    await expect(page.locator('h1.dash-page-title')).toContainText(apiaryName, { timeout: 15_000 });

    await page.locator('button.dash-admin-btn-danger', { hasText: 'Delete Apiary' }).click();
    await page.locator('button.dash-admin-btn-danger', { hasText: 'Confirm Delete' }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  });
});
