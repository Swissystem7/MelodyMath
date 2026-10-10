const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const e2eDir = path.join(__dirname, 'e2e');

function ensurePlaywright() {
  const pwRoot = path.join(e2eDir, 'node_modules', 'playwright');
  if (fs.existsSync(pwRoot)) {
    return require(pwRoot);
  }
  const install = spawnSync('npm', ['install', '--omit=dev'], {
    cwd: e2eDir,
    encoding: 'utf8',
    timeout: 180_000,
  });
  assert.equal(install.status, 0, install.stderr || install.stdout);
  return require(pwRoot);
}
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const coreJs = fs.readFileSync(path.join(root, 'src/lib/core.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('index is mobile-first: touch targets, table scroll, music engine, and audio unlock', () => {
  assert.match(indexHtml, /src\/lib\/musicEngine\.js/);
  assert.match(indexHtml, /min-height:44px/);
  assert.match(indexHtml, /\.table-scroll/);
  assert.match(indexHtml, /class="table-scroll"/);
  assert.match(coreJs, /installAudioUnlock/);
  assert.match(coreJs, /pointerdown/);
  assert.match(coreJs, /unlockAudio/);
  assert.match(coreJs, /השמע שוב/);
  assert.match(sw, /musicEngine\.js/);
  assert.match(sw, /melodymath-offline-v10/);
});

test('playwright mobile spec exists for the five required viewports', () => {
  const spec = fs.readFileSync(path.join(__dirname, 'e2e/mobile.spec.js'), 'utf8');
  assert.match(spec, /820.*1180/);
  assert.match(spec, /390.*844/);
  assert.match(spec, /360.*740/);
  assert.match(spec, /iPhone 13/);
  assert.match(spec, /Pixel 7/);
  assert.match(spec, /scrollWidth/);
  assert.match(spec, /getBoundingClientRect|>= 44/);
});

test('mobile e2e passes in Playwright', async () => {
  const playwright = ensurePlaywright();
  const { runMobileE2E } = require('./e2e/mobile.spec.js');
  const server = spawn('node', ['scripts/e2e-static-server.cjs'], {
    cwd: root,
    stdio: 'pipe',
    env: { ...process.env, MM_E2E_PORT: '8765' },
  });
  await new Promise((resolve) => setTimeout(resolve, 400));
  try {
    await runMobileE2E(playwright);
  } finally {
    server.kill('SIGTERM');
  }
});
