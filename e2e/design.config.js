// #427 — browser checks for the demo design, pace meter and first screen, at
// the two widths the issue names. Not part of npm test (no Playwright or axe
// dependency in the repo). Run:
//
//   npx --yes -p @playwright/test@1.49 -p axe-core@4.10 playwright install chromium
//   npx --yes -p @playwright/test@1.49 -p axe-core@4.10 playwright test --config e2e/design.config.js
//
// Screenshots for a design PR: run once on master with MM_SHOT=before and once
// on the PR branch with MM_SHOT=after; they land in docs/screenshots/<MM_PR>/.
const path = require('node:path');
const PORT = 8139;
const BASE = 'http://127.0.0.1:' + PORT;

module.exports = {
  testDir: __dirname,
  testMatch: 'design.spec.js',
  timeout: 45000,
  forbidOnly: true,
  use: { baseURL: BASE, locale: 'he-IL' },
  webServer: {
    command: 'python3 -m http.server ' + PORT + ' --bind 127.0.0.1',
    cwd: path.join(__dirname, '..'),
    url: BASE + '/index.html',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'mobile-360', use: { viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true } },
    { name: 'desktop-1366', use: { viewport: { width: 1366, height: 768 } } },
  ],
};
