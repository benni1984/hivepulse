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

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

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

// -- Find hive URL from first apiary --
const apiaryCard = page.locator('a[href*="/apiary/"]').first();
const apiaryHref = await apiaryCard.getAttribute('href');
console.log('Apiary:', apiaryHref);
await apiaryCard.click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);

// Apiary create modal
await page.goto(STAGING + '/en/dashboard');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
const newApiaryBtn = page.locator('button').filter({ hasText: /new apiary/i }).first();
await newApiaryBtn.waitFor({ timeout: 5000 });
await newApiaryBtn.click();
await page.waitForTimeout(800);
await shot(page, 'apiary-create-form');
await page.keyboard.press('Escape');

// Navigate to apiary
await page.goto(STAGING + '/en/dashboard');
await page.waitForTimeout(1000);
await page.locator('a[href*="/apiary/"]').first().click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);

// New hive modal
const newHiveBtn = page.locator('button').filter({ hasText: /new hive/i }).first();
await newHiveBtn.waitFor({ timeout: 5000 });
await newHiveBtn.click();
await page.waitForTimeout(800);
await shot(page, 'hive-create-form');
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// Into first hive
const hiveLink = page.locator('a[href*="/hive/"]').first();
const hiveHref = await hiveLink.getAttribute('href');
console.log('Hive:', hiveHref);
await hiveLink.click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1200);

// Inspection form
const inspBtn = page.locator('button').filter({ hasText: /new inspection/i }).first();
await inspBtn.waitFor({ timeout: 8000 });
await inspBtn.click();
await page.waitForTimeout(1000);
await shot(page, 'inspection-form');
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// Data export — try CSV button
const exportCsvBtn = page.locator('button').filter({ hasText: /export csv/i }).first();
const exportJsonBtn = page.locator('button').filter({ hasText: /export json/i }).first();
if (await exportCsvBtn.count() > 0) {
  // scroll to find it
  await exportCsvBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await shot(page, 'data-export-buttons');
} else {
  console.log('No export buttons visible on hive page');
}

// QR batch detail
await page.goto(STAGING + '/en/dashboard/qr-batches');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
const batchViewBtn = page.locator('a').filter({ hasText: /view/i }).first();
const batchLink2 = page.locator('[href*="/qr-batches/"]').first();
if (await batchLink2.count() > 0) {
  await batchLink2.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await shot(page, 'qr-batch-detail');
} else {
  // Create a batch first
  const newBatchBtn = page.locator('button').filter({ hasText: /new batch/i }).first();
  if (await newBatchBtn.count() > 0) {
    await newBatchBtn.click();
    await page.waitForTimeout(600);
    await shot(page, 'qr-batch-create');
    await page.keyboard.press('Escape');
  }
}

// Custom field create dialog
await page.goto(STAGING + '/en/dashboard/field-definitions');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
const newFieldBtn = page.locator('button').filter({ hasText: /new field/i }).first();
await newFieldBtn.waitFor({ timeout: 5000 });
await newFieldBtn.click();
await page.waitForTimeout(700);
await shot(page, 'custom-field-create');
await page.keyboard.press('Escape');

await browser.close();
console.log('\nModal screenshots done →', OUT);
