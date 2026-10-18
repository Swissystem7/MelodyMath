// Desktop and phone, Hebrew RTL. Not part of npm test (no Playwright dependency).
const path = require('node:path');
const PORT = 8138;
const BASE = 'http://127.0.0.1:' + PORT;

module.exports = {
  testDir: __dirname,
  testMatch: 'planScenarios.spec.js',
  timeout: 30000,
  use: { baseURL: BASE, locale: 'he-IL' },
  webServer: {
    command: 'python3 -m http.server ' + PORT + ' --bind 127.0.0.1',
    cwd: path.join(__dirname, '..'),
    url: BASE + '/index.html',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
};
