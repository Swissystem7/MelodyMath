// MM-701 regression suite: Playwright config.
//
// Default target: the LOCAL build of this repo, served by ./serve.js on
// 127.0.0.1:8171 (deterministic; every request to another host is aborted
// in specs/_fixtures.js). Optional: point it at a deployed site with
//   AUDIT_BASE_URL=https://swissystem7.github.io/MelodyMath/ npx playwright test
// (then no local server is started, and only that host is allowed).
//
// Known bugs are marked with test.fail() and carry the finding ID and the
// MM-7xx task ID in the title. The suite is green today; when a fix lands the
// matching test reports "expected to fail, but passed", which is the signal to
// remove its test.fail() marker in the same PR as the fix.
//
// This folder is outside the repo's `npm test` (node --test only picks up
// *.test.js / test/ files, and audit/ has neither) and outside CI.
'use strict';
const { defineConfig } = require('@playwright/test');

const PORT = Number(process.env.AUDIT_PORT || 8171);
const LOCAL = 'http://127.0.0.1:' + PORT + '/';
const BASE = (process.env.AUDIT_BASE_URL || LOCAL).replace(/\/?$/, '/');
const isLocal = !process.env.AUDIT_BASE_URL;

module.exports = defineConfig({
  testDir: './specs',
  testMatch: /\.spec\.js$/,
  timeout: 60000,
  expect: { timeout: 7000 },
  fullyParallel: false,
  workers: process.env.AUDIT_WORKERS ? Number(process.env.AUDIT_WORKERS) : 2,
  retries: 0,
  forbidOnly: true,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: BASE,
    locale: 'he-IL',
    serviceWorkers: 'allow',
    screenshot: 'only-on-failure',
  },
  webServer: isLocal ? {
    command: 'node serve.js',
    cwd: __dirname,
    url: LOCAL + 'index.html',
    reuseExistingServer: !process.env.CI,
    env: { AUDIT_PORT: String(PORT) },
  } : undefined,
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } }, testIgnore: /phone\.spec\.js$/ },
    {
      name: 'phone360',
      use: { viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: false },
      // Curriculum checks read data, not layout: run them once (desktop).
      testIgnore: /curriculum\.spec\.js$/,
    },
  ],
});
