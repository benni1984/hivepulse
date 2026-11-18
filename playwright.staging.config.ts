import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/staging',
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'https://apiscan-staging.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'admin-setup', testMatch: /admin\.setup\.ts/ },
    { name: 'supporter-setup', testMatch: /supporter\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
      // The three write-heavy specs moved to the supporter project below: custom fields belong
      // to the subscription now, and creating hives runs into the free limit on an account that
      // has been collecting them since the suite was written (#478).
      testIgnore: /\/(admin|members|dashboard-mobile-nav|field-definitions|hive|inspection)\.spec\.ts/,
    },
    {
      // A paying account. The demo account above deliberately stays free, because stats.spec and
      // members.spec prove that a non-supporter is turned away from the community dashboard --
      // the free tier is most people, and it is worth covering.
      name: 'supporter',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/supporter.json',
      },
      dependencies: ['supporter-setup'],
      testMatch: /\/(field-definitions|hive|inspection)\.spec\.ts/,
    },
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['admin-setup'],
      testMatch: /\/(admin|members)\.spec\.ts/,
    },
    {
      // Chromium-based mobile device -- CI only installs the `chromium`
      // browser (`npx playwright install --with-deps chromium`), so a
      // WebKit-based device profile (e.g. 'iPhone 13') would fail to launch.
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /\/dashboard-mobile-nav\.spec\.ts/,
    },
  ],
});
