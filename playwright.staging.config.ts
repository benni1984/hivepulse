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
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /\/(admin|members|dashboard-mobile-nav)\.spec\.ts/,
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
