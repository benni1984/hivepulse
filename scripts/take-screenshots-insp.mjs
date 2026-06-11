import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STAGING = 'https://apiscan-two.vercel.app';
const EMAIL = 'demo@apiscan.app';
const PASSWORD = 'demo1234';
const OUT = path.join(__dirname, '../public/docs/screenshots');

async function shot(page, name) {
  const file = path.join(OUT, name + '.png');
  await page.screenshot({ path: file });
  console.log('✓', name);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
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

// Navigate directly to known hive
await page.goto(STAGING + '/en/dashboard/hive/a479dded-81a3-4c66-849f-106333ea3afb');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);

// Scroll down to see inspections list + New Inspection button
await page.evaluate(() => window.scrollTo(0, 400));
await page.waitForTimeout(500);
await shot(page, 'hive-detail-web');

// Click New Inspection
const inspBtn = page.locator('button').filter({ hasText: /new inspection/i }).first();
console.log('Inspection btn count:', await inspBtn.count());
await inspBtn.waitFor({ timeout: 8000 });
await inspBtn.scrollIntoViewIfNeeded();
await inspBtn.click();
await page.waitForTimeout(1200);
await shot(page, 'inspection-form');

// Scroll inside the modal to show more fields
await page.evaluate(() => {
  const modal = document.querySelector('.dash-modal, [role=dialog], .modal-overlay, .dash-slide-panel');
  if (modal) modal.scrollTop = 200;
});
await page.waitForTimeout(400);
await shot(page, 'inspection-form-bottom');

await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// Export buttons visible on hive page
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(500);
await shot(page, 'hive-detail-export-area');

await browser.close();
console.log('Done');
