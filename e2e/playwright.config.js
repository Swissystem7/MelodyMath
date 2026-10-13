// MelodyMath — the browser checks plan §4.6 requires, in the five viewports.
//
// Deliberately outside `npm test`: node --test must stay dependency-free
// (AGENTS.md), so Playwright is never added to package.json and this suite is
// run by hand whenever a change touches audio, layout or the service worker:
//
//   npx --yes playwright@1.49 install --with-deps chromium webkit
//   npx --yes playwright@1.49 test --config e2e/playwright.config.js
//
// The static server is python3's own, so nothing is installed into the repo.
// http://127.0.0.1 is a secure context, which the service worker needs.
const path = require('node:path');
const { devices } = require('@playwright/test');

const PORT = 8137;
const BASE = 'http://127.0.0.1:' + PORT;

module.exports = {
  testDir: __dirname,
  timeout: 45000,
  forbidOnly: true,
  use: { baseURL: BASE, screenshot: 'only-on-failure' },
  webServer: {
    command: 'python3 -m http.server ' + PORT + ' --bind 127.0.0.1',
    cwd: path.join(__dirname, '..'),
    url: BASE + '/index.html',
    reuseExistingServer: true,
  },
  projects: [
    // Tablet and the two phone widths the plan names, then real device profiles.
    { name: 'tablet-820x1180', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: 'phone-390x844', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: 'phone-360x740', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 }, hasTouch: true } },
    { name: 'iPhone 13', use: { ...devices['iPhone 13'] } },
    { name: 'Pixel 7', use: { ...devices['Pixel 7'] } },
  ],
};
