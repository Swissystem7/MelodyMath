// Mobile pass (#101): no horizontal scroll and 44px targets on every visible
// button, on every home tab, at the five phone/tablet sizes from the plan.
//
// Playwright is not a dependency (AGENTS.md: no installs). This file runs
// under `node --test` and skips itself when Playwright is not importable.
// To run it for real: `npx -y playwright@1 install chromium` once, then
// `NODE_PATH=$(npm root -g) node --test test/e2e/mobile.spec.mjs` with
// playwright installed globally, or from any checkout that has it.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let pw = null;
try { pw = createRequire(import.meta.url)('playwright'); } catch (e) { /* not installed */ }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.join(root, rel);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

function sizes() {
  return [
    { name: '820x1180', viewport: { width: 820, height: 1180 } },
    { name: '390x844', viewport: { width: 390, height: 844 } },
    { name: '360x740', viewport: { width: 360, height: 740 } },
    { name: 'iPhone 13', ...pw.devices['iPhone 13'] },
    { name: 'Pixel 7', ...pw.devices['Pixel 7'] },
  ];
}

// Every visible button-like target on the page that is smaller than 44x44.
function smallTargets() {
  const out = [];
  document.querySelectorAll('button, [role=tab], summary, .navcard, select').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') return;
    if (r.width < 44 || r.height < 44) out.push(`${el.id || el.className || el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`);
  });
  return out;
}

test('index.html fits phones and tablets: no sideways scroll, 44px targets, audio after a tap, offline reload', { skip: pw ? false : 'playwright not installed' }, async () => {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await pw.chromium.launch();
  try {
    for (const { name, ...opts } of sizes()) {
      const context = await browser.newContext(opts);
      const page = await context.newPage();
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(base + 'index.html');
      const tabs = await page.$$('.tabs [role="tab"]');
      for (let i = 0; i < tabs.length; i++) {
        await (await page.$$('.tabs [role="tab"]'))[i].click();
        const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(wide <= 0, `${name} tab ${i}: page scrolls sideways by ${wide}px`);
        assert.deepEqual(await page.evaluate(smallTargets), [], `${name} tab ${i}: targets under 44px`);
      }
      await page.screenshot({ path: path.join(root, 'test', 'e2e', `mobile-${name.replace(/\W+/g, '-')}.png`), fullPage: true });
      const state = await page.evaluate(() => { const ac = getAudioContext(); return ac && ac.state; });
      assert.notEqual(state, 'suspended', `${name}: audio still locked after a tap`);
      await page.evaluate(() => navigator.serviceWorker && navigator.serviceWorker.ready);
      await context.setOffline(true);
      await page.reload();
      assert.ok(await page.$('.tabs'), `${name}: offline reload lost the page`);
      assert.deepEqual(errors, [], `${name}: console errors`);
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
});
