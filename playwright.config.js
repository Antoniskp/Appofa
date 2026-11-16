const { defineConfig, devices } = require('@playwright/test');
const apiPort = Number(process.env.E2E_API_PORT || 3100);
const frontendPort = Number(process.env.E2E_FRONTEND_PORT || 3101);

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  // Fail once with traces/screenshots; retrying long browser journeys multiplies CI time.
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    actionTimeout: 15000,
    navigationTimeout: 30000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      testMatch: ['**/signup.spec.js', '**/participation.spec.js', '**/location-dashboard.spec.js', '**/map-explorer.spec.js', '**/homepage-map.spec.js'],
      grep: /signup|homepage action controls use the en locale|location dashboard provides useful routes and a scoped agenda|map explorer|homepage local map/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: [
    { command: 'node e2e/server.cjs', url: `http://127.0.0.1:${apiPort}/api/health`, timeout: 120000, reuseExistingServer: false },
    {
      command: `node node_modules/next/dist/bin/next start -p ${frontendPort} -H 127.0.0.1`,
      url: `http://127.0.0.1:${frontendPort}`, timeout: 60000, reuseExistingServer: false,
      env: { NODE_ENV: 'production', API_URL: `http://127.0.0.1:${apiPort}`, NEXT_TELEMETRY_DISABLED: '1' },
    },
  ],
});
