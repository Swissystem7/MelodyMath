// Stream A (app shell) browser checks at 360x640 and 1280x800. First:
// MM-711 child-first home (the student start button is on the first screen).
// Not part of npm test: Playwright is never added to package.json (AGENTS.md).
// The shared e2e/playwright.config.js also picks these specs up. Run:
//
//   npx --yes -p @playwright/test@1.49 playwright install chromium
//   npx --yes -p @playwright/test@1.49 playwright test --config e2e/app-shell/playwright.config.js
//
// The server is e2e/app-shell/staticServer.js (plain Node), so this config also runs on
// Windows, where `python3` is often only the Microsoft Store stub.
const path = require('node:path');
const PORT = Number(process.env.MM_E2E_PORT || 8141);
const BASE = 'http://127.0.0.1:' + PORT;

module.exports = {
  testDir: __dirname,
  testMatch: '*.spec.js',
  timeout: 45000,
  forbidOnly: true,
  use: { baseURL: BASE, locale: 'he-IL' },
  webServer: {
    command: 'node e2e/app-shell/staticServer.js ' + PORT,
    cwd: path.join(__dirname, '..', '..'),
    url: BASE + '/index.html',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'phone-360x640', use: { viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true } },
    { name: 'desktop-1280x800', use: { viewport: { width: 1280, height: 800 } } },
  ],
};
