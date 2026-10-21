// The smoke pass against the deployed site, at the 390px phone width the
// manual check on 17.10 used. Run through tools/e2e-live.js, or by hand:
//   MM_BASE_URL=http://127.0.0.1:8137/ npx --yes playwright@1.49 test --config e2e/live.config.js
// The trailing slash matters: the spec opens pages by relative path.
const os = require('node:os');
const path = require('node:path');

const BASE = process.env.MM_BASE_URL || 'https://swissystem7.github.io/MelodyMath/';

module.exports = {
  testDir: __dirname,
  // Failure screenshots stay out of the working tree.
  outputDir: path.join(os.tmpdir(), 'melodymath-e2e', 'results'),
  testMatch: 'smoke.spec.js',
  timeout: 90000,
  retries: 1,
  forbidOnly: true,
  reporter: [['line']],
  use: {
    baseURL: BASE,
    locale: 'he-IL',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium-390' }],
};
