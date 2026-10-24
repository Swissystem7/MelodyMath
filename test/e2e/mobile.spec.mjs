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

// #469 demo smoke for #355 #356 #425 #426 #461 #465: one PASS / FAIL line per
// check with the selector that failed. It hits the live site, so it only runs
// when asked: `MM_SMOKE=1` (or `MM_SMOKE=local` to serve this checkout instead).
const LIVE = 'https://swissystem7.github.io/MelodyMath/';
const GRADE1_COVERED = 12; // «כיתה א׳ 12 מכוסה» after #356 task A; bump if task B lands.
const SMOKE = process.env.MM_SMOKE;

async function smokeChecks(page, base, check) {
  const go = (p) => page.goto(base + p, { waitUntil: 'load' });
  const count = (sel) => page.locator(sel).count();
  const text = (sel) => page.locator(sel).first().innerText({ timeout: 3000 }).catch(() => '');
  const tab = (id) => page.click(`#tab-${id}`);

  await go('index.html');
  await check('1 nav «סרטון הדגמה»', 'nav a[href*="demo.html"]:has-text("סרטון הדגמה")', async (s) => (await count(s)) > 0);
  await go('demo.html');
  await check('1 demo.html 4 scene buttons', '.demo-scene-btn', async (s) => (await count(s)) === 4);

  await go('curriculum.html');
  await check(`2 «כיתה א׳ ${GRADE1_COVERED} מכוסה»`, 'body',
    async (s) => new RegExp(`כיתה א׳[^\\n]*\\b${GRADE1_COVERED}\\b[^\\n]*מכוסה`).test(await text(s)));

  await go('index.html');
  const tabs = await page.$$eval('.tabs [role="tab"]', (els) => els.map((el) => el.dataset.tab));
  await check('3 plan card «טווח טיפוסי»', '.mm-plan-slot', async (s) =>
    (await page.$$eval(s, (els) => els.map((el) => el.textContent))).some((t) => t.includes('טווח טיפוסי')));
  for (const id of tabs) {
    await tab(id);
    await check(`3 tab ${id} why line`, `#${id} > .mm-plan-slot .mm-plan-why`, async (s) => (await count(s)) === 1);
    await check(`7 tab ${id} no sideways scroll`, 'html',
      () => page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth));
  }

  await tab('remediation');
  for (const g of ['א', 'ב', 'ג', 'ד']) {
    await page.click(`#gradePick [data-grade="${g}"]`);
    await check(`4 grade ${g} start card ≤ 3 topics`, '#rmStart #rmStruggleList button', async (s) => (await count(s)) <= 3);
  }

  await page.click('#gradePick [data-grade="ג"]');
  await page.fill('#classCode', 'smoke-469');
  await page.fill('#studentName', 'בדיקה');
  await page.click('#whoSave');
  await tab('classMode');
  await page.click('#classStart');
  await check('5 grade ג׳ class item tag «כיתה ג׳»', '#classItemTag', async (s) => (await text(s)).trim().startsWith('כיתה ג׳'));
  await page.click('#classCancel').catch(() => {});

  await tab('beatMode');
  const packed = await page.selectOption('#beatPack', { label: 'מעבר עשרת' }, { timeout: 2000 }).then(() => true, () => false);
  if (packed) await page.click('#beatStart');
  await check('6 beat pack «מעבר עשרת» duo widget', '#beatPack option:has-text("מעבר עשרת") → #beatWidget .vert',
    async () => packed && page.locator('#beatWidget .vert').first().isVisible({ timeout: 4000 }).catch(() => false));
}

test('demo upgrades live smoke at 390x844 and 1280x800', { skip: !pw ? 'playwright not installed' : !SMOKE ? 'set MM_SMOKE=1 (live) or MM_SMOKE=local' : false }, async () => {
  const server = SMOKE === 'local' ? await serve() : null;
  const base = server ? `http://127.0.0.1:${server.address().port}/` : (process.env.MM_SMOKE_URL || LIVE);
  const browser = await pw.chromium.launch();
  const lines = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
      const size = `${viewport.width}x${viewport.height}`;
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push(String(e)));
      const check = async (label, selector, fn) => {
        const ok = await Promise.resolve().then(() => fn(selector)).catch(() => false);
        lines.push(`${ok ? 'PASS' : 'FAIL'} ${size} ${label}${ok ? '' : ` — ${selector}`}`);
      };
      await smokeChecks(page, base, check).catch((e) => lines.push(`FAIL ${size} aborted — ${String(e).split('\n')[0]}`));
      lines.push(`${errors.length ? 'FAIL' : 'PASS'} ${size} 7 zero console.error${errors.length ? ` — ${errors[0]}` : ''}`);
      await context.close();
    }
  } finally {
    await browser.close();
    if (server) server.close();
  }
  console.log(lines.join('\n'));
  assert.deepEqual(lines.filter((l) => l.startsWith('FAIL')), [], `smoke against ${base}`);
});
