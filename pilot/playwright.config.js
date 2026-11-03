// MM-600 pilot — Playwright config, self-contained in pilot/ (the repo's own
// e2e/ and CI are untouched; the root package.json only forwards to it). Run:
//   cd pilot && npm ci && npx playwright install chromium && npm test
//   (or, from the repo root after that setup: npm run test:pilot)
// Service workers are blocked by default so page.route sees every request;
// e2e/homeLinkOffline.spec.js allows them for its offline test.
// Deterministic: one worker, no retries, a local server on 127.0.0.1, and
// every request to any other host is aborted by the tests (page.route).
'use strict';
const { devices } = require('@playwright/test');

const PORT = Number(process.env.PILOT_PORT) || 8160;
const BASE = 'http://127.0.0.1:' + PORT;

module.exports = {
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  use: { baseURL: BASE, serviceWorkers: 'block', locale: 'he-IL', timezoneId: 'Asia/Jerusalem', screenshot: 'only-on-failure', trace: 'off' },
  webServer: {
    command: 'node serve.js',
    cwd: __dirname,
    env: { PORT: String(PORT) },
    url: BASE + '/pilot/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 20000
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile-360', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: false } }
  ]
};
