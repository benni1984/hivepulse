import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STAGING = 'https://apiscan-two.vercel.app';
const EMAIL = 'demo@apiscan.app';
const PASSWORD = 'demo1234';
const OUT = path.join(__dirname, '../public/docs/screenshots');
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  const file = path.join(OUT, name + '.png');
  await page.screenshot({ path: file });
  console.log('✓', name);
}

async function shotEl(page, name, selector) {
  const file = path.join(OUT, name + '.png');
  try {
    const el = page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 5000 });
    await el.screenshot({ path: file });
    console.log('✓', name, '(cropped)');
  } catch {
    await page.screenshot({ path: file });
    console.log('✓', name, '(fallback full page)');
  }
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

// Register page
await page.goto(STAGING + '/en/dashboard/register');
await page.waitForLoadState('networkidle');
await shot(page, 'register-form');

// Login
await page.goto(STAGING + '/en/dashboard/login');
await page.waitForLoadState('networkidle');
await page.fill('input[type=email]', EMAIL);
await page.fill('input[type=password]', PASSWORD);
await Promise.all([
  page.waitForURL('**/dashboard', { timeout: 15000 }),
  page.click('button[type=submit]')
]);
await page.waitForTimeout(2000);
await shot(page, 'dashboard-apiary-list');

// Apiary create modal
const newApiaryBtn = page.locator('button').filter({ hasText: /new apiary/i }).first();
if (await newApiaryBtn.count() > 0) {
  await newApiaryBtn.click();
  await page.waitForTimeout(700);
  await shot(page, 'apiary-create-form');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

// Into first apiary
const apiaryCard = page.locator('a[href*="/apiary/"]').first();
if (await apiaryCard.count() > 0) {
  await apiaryCard.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // New hive form
  const newHiveBtn = page.locator('button').filter({ hasText: /new hive/i }).first();
  if (await newHiveBtn.count() > 0) {
    await newHiveBtn.click();
    await page.waitForTimeout(700);
    await shot(page, 'hive-create-form');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // Into first hive
  const hiveLink = page.locator('a[href*="/hive/"]').first();
  if (await hiveLink.count() > 0) {
    await hiveLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await shot(page, 'hive-detail-web');

    // New inspection modal
    const inspBtn = page.locator('button').filter({ hasText: /new inspection/i }).first();
    if (await inspBtn.count() > 0) {
      await inspBtn.click();
      await page.waitForTimeout(800);
      await shot(page, 'inspection-form');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // Export modal
    const exportBtn = page.locator('button').filter({ hasText: /^export/i }).first();
    if (await exportBtn.count() > 0) {
      await exportBtn.click();
      await page.waitForTimeout(600);
      await shot(page, 'data-export-dialog');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }
  }
}

// Hive stats (personal overview)
await page.goto(STAGING + '/en/dashboard/stats');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);
await shot(page, 'hive-stats-overview');

// QR batches
await page.goto(STAGING + '/en/dashboard/qr-batches');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
await shot(page, 'qr-batches-list');
const batchLink = page.locator('a[href*="/qr-batches/"]').first();
if (await batchLink.count() > 0) {
  await batchLink.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await shot(page, 'qr-batch-detail');
}

// Custom fields
await page.goto(STAGING + '/en/dashboard/field-definitions');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
await shot(page, 'custom-fields-list');
const newFieldBtn = page.locator('button').filter({ hasText: /new field/i }).first();
if (await newFieldBtn.count() > 0) {
  await newFieldBtn.click();
  await page.waitForTimeout(600);
  await shot(page, 'custom-field-create');
  await page.keyboard.press('Escape');
}

// Community / members
await page.goto(STAGING + '/en/dashboard/members');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);
await shot(page, 'community-stats');

// Hornet tracker
await page.goto(STAGING + '/en/hornets');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
await shot(page, 'hornet-tracker-landing');

await page.goto(STAGING + '/en/hornets/report');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);
await shot(page, 'hornet-report-form');

await page.goto(STAGING + '/en/hornets/community');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
await shot(page, 'hornet-community-sightings');

await page.goto(STAGING + '/en/hornets/traps');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);
await shot(page, 'hornet-traps-page');

await browser.close();
console.log('\nAll web screenshots saved to', OUT);
