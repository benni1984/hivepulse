/**
 * Capture all HivePulse web help-page screenshots against staging.
 *
 * Usage:
 *   node scripts/web-screenshots.mjs
 *
 * Env vars (all optional — defaults to staging demo account):
 *   STAGING_URL    https://apiscan-two.vercel.app
 *   DEMO_EMAIL     demo@apiscan.app
 *   DEMO_PASSWORD  demo1234
 *
 * Output: public/docs/screenshots/*.png
 */

import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE  = process.env.STAGING_URL  || 'https://apiscan-two.vercel.app';
const EMAIL = process.env.DEMO_EMAIL   || 'demo@apiscan.app';
const PASS  = process.env.DEMO_PASSWORD || 'demo1234';
const OUT   = path.join(__dirname, '../public/docs/screenshots');

fs.mkdirSync(OUT, { recursive: true });

// ── Helpers ───────────────────────────────────────────────────────────────────

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('✓', name);
}

async function shotElement(page, name, selector) {
  const file = path.join(OUT, `${name}.png`);
  try {
    const el = page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 5_000 });
    await el.screenshot({ path: file });
    console.log('✓', name, '(element)');
  } catch {
    await page.screenshot({ path: file });
    console.log('✓', name, '(fallback)');
  }
}

async function goto(page, url) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
}

// ── Login ─────────────────────────────────────────────────────────────────────

const browser = await chromium.launch({ headless: true });
const ctx  = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

await goto(page, `${BASE}/en/dashboard/login`);
await page.fill('input[type=email]', EMAIL);
await page.fill('input[type=password]', PASS);
await Promise.all([
  page.waitForURL('**/dashboard', { timeout: 20_000 }),
  page.click('button[type=submit]'),
]);
await page.waitForTimeout(1_500);

// ── Dashboard overview ────────────────────────────────────────────────────────

await shot(page, 'dashboard-apiary-list');

// New apiary dialog
const newApiaryBtn = page.locator('button').filter({ hasText: /new apiary/i }).first();
if (await newApiaryBtn.count() > 0) {
  await newApiaryBtn.click();
  await page.waitForTimeout(600);
  await shot(page, 'apiary-create-form');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

// ── Hive detail ───────────────────────────────────────────────────────────────

const apiaryCard = page.locator('a[href*="/apiary/"]').first();
if (await apiaryCard.count() > 0) {
  await apiaryCard.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  const newHiveBtn = page.locator('button').filter({ hasText: /new hive/i }).first();
  if (await newHiveBtn.count() > 0) {
    await newHiveBtn.click();
    await page.waitForTimeout(600);
    await shot(page, 'hive-create-form');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  const hiveLink = page.locator('a[href*="/hive/"]').first();
  if (await hiveLink.count() > 0) {
    await hiveLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await shot(page, 'hive-detail-web');

    // Inspection form modal
    const inspBtn = page.locator('button').filter({ hasText: /new inspection/i }).first();
    if (await inspBtn.count() > 0) {
      await inspBtn.click();
      await page.waitForTimeout(800);
      await shot(page, 'inspection-form');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // Export area on hive detail page
    const exportBtn = page.locator('button').filter({ hasText: /^export/i }).first();
    if (await exportBtn.count() > 0) {
      await exportBtn.click();
      await page.waitForTimeout(600);
      await shot(page, 'hive-detail-export-area');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

await goto(page, `${BASE}/en/dashboard/stats`);
await page.waitForTimeout(1_000);
await shot(page, 'hive-stats-overview');

// ── QR Batches ────────────────────────────────────────────────────────────────

await goto(page, `${BASE}/en/dashboard/qr-batches`);
await shot(page, 'qr-batches-list');

const batchLink = page.locator('a[href*="/qr-batches/"]').first();
if (await batchLink.count() > 0) {
  await batchLink.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await shot(page, 'qr-batch-detail');
}

// ── Custom field definitions ──────────────────────────────────────────────────

await goto(page, `${BASE}/en/dashboard/field-definitions`);
await shot(page, 'custom-fields-list');

const newFieldBtn = page.locator('button').filter({ hasText: /new field/i }).first();
if (await newFieldBtn.count() > 0) {
  await newFieldBtn.click();
  await page.waitForTimeout(600);
  await shot(page, 'custom-field-create');
  await page.keyboard.press('Escape');
}

// ── Community / members ───────────────────────────────────────────────────────

await goto(page, `${BASE}/en/dashboard/members`);
await page.waitForTimeout(1_000);
await shot(page, 'community-stats');

// ── Hornet tracker ────────────────────────────────────────────────────────────

await goto(page, `${BASE}/en/hornets`);
await shot(page, 'hornet-tracker-landing');

await goto(page, `${BASE}/en/hornets/report`);
await shot(page, 'hornet-report-form');

await goto(page, `${BASE}/en/hornets/community`);
await shot(page, 'hornet-community-sightings');

await goto(page, `${BASE}/en/hornets/traps`);
await shot(page, 'hornet-traps-page');

// ── Help pages (public, no auth needed) ──────────────────────────────────────

const helpPages = [
  ['help-index',         '/en/help'],
  ['help-hive-overview', '/en/help/hive-management'],
  ['help-qr-codes',      '/en/help/qr-codes'],
  ['help-inspections',   '/en/help/inspection-logging'],
  ['help-stats',         '/en/help/stats-export'],
  ['help-hornets',       '/en/help/hornet-tracker'],
  ['help-community',     '/en/help/community'],
];

for (const [name, urlPath] of helpPages) {
  await goto(page, `${BASE}${urlPath}`);
  await shot(page, name);
}

await browser.close();
console.log('\nAll web screenshots saved to', OUT);
