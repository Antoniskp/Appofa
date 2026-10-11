const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://127.0.0.1:3101', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    { command: 'node e2e/server.cjs', url: 'http://127.0.0.1:3100/api/health', timeout: 120000, reuseExistingServer: false },
    {
      command: 'node node_modules/next/dist/bin/next dev --webpack -p 3101 -H 127.0.0.1',
      url: 'http://127.0.0.1:3101', timeout: 180000, reuseExistingServer: false,
      env: { NODE_ENV: 'development', API_URL: 'http://127.0.0.1:3100', NEXT_PUBLIC_API_URL: 'http://127.0.0.1:3100', NEXT_DIST_DIR: '.next-e2e', NEXT_TELEMETRY_DISABLED: '1' },
    },
  ],
});
