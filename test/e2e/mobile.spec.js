// MelodyMath — the mobile acceptance spec for plan §4.6 (issue #101).
//
// Five device profiles, every home tab in each: zero console errors, no
// horizontal scroll, 44×44px finger targets on every visible button, Web Audio
// still locked until the first tap, and a reload that works offline.
//
// Playwright is deliberately NOT a repo dependency (AGENTS.md: no deps, no
// bundler, no CDN), so this file is not part of `npm test`. Run it with a
// throwaway install:
//
//   npx --yes playwright@1 install chromium webkit
//   npx --yes playwright@1 test test/e2e/mobile.spec.js --reporter=list
//
// Chromium or WebKit, not Firefox: the two phone profiles set `isMobile`,
// which Firefox does not emulate. Screenshots land as attachments under
// `test-results/`; attach them to the PR.
//
// `node --test` walks everything under test/, so both the require and the
// registration are guarded: without Playwright the file loads as an empty
// module instead of breaking the unit suite.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const SITE_ROOT = path.join(__dirname, '..', '..');
// The 44px / 8px rule itself lives in access.js and is unit-tested there, so
// this spec measures and that module judges.
const { touchTargetIssues, TARGET_MIN_PX } = require('../../src/lib/access.js');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

// A service worker needs a real origin, and http://localhost counts as a secure
// context. Twenty lines of node:http beat adding a static-server dependency.
function startSite() {
  const server = http.createServer(function (req, res) {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const file = path.join(SITE_ROOT, rel);
    if (!file.startsWith(SITE_ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(function (resolve) {
    server.listen(0, '127.0.0.1', function () {
      resolve({ server: server, base: 'http://127.0.0.1:' + server.address().port + '/' });
    });
  });
}

// The six tabs of index.html: practice by grade, intervals, lab, class mode,
// on-the-beat, teacher report.
const TABS = [
  'tab-remediation',
  'tab-practice',
  'tab-playground',
  'tab-classMode',
  'tab-beatMode',
  'tab-teacherReport',
];

function registerSpecs(pw) {
  const test = pw.test;
  const expect = pw.expect;
  const devices = pw.devices;

  const PROFILES = [
    { name: 'tablet-820x1180', use: { viewport: { width: 820, height: 1180 } } },
    { name: 'phone-390x844', use: { viewport: { width: 390, height: 844 } } },
    { name: 'phone-360x740', use: { viewport: { width: 360, height: 740 } } },
    { name: 'iPhone 13', use: devices['iPhone 13'] },
    { name: 'Pixel 7', use: devices['Pixel 7'] },
  ];

  let site = null;
  test.beforeAll(async function () {
    site = await startSite();
  });
  test.afterAll(async function () {
    if (site) await new Promise(function (r) { site.server.close(r); });
  });

  // Fails the test on anything the page logs as an error, including a failed
  // fetch of a file sw.js forgot to precache.
  function watchConsole(page, errors) {
    page.on('console', function (msg) {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', function (err) {
      errors.push(String(err));
    });
  }

  async function expectNoHorizontalScroll(page, where) {
    const box = await page.evaluate(function () {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        // The page is dir="rtl", so an over-wide box hangs off the LEFT edge
        // as often as the right. Name the worst offender either way, otherwise
        // a failure is a bare number with nothing to fix.
        widest: (function () {
          let worst = null;
          let over = 1;
          document.querySelectorAll('body *').forEach(function (el) {
            const r = el.getBoundingClientRect();
            if (r.width === 0) return;
            const spill = Math.max(r.right - window.innerWidth, -r.left);
            if (spill <= over) return;
            over = spill;
            worst = { spill: Math.round(spill), tag: el.tagName, cls: el.className || el.id };
          });
          return worst;
        })(),
      };
    });
    expect(box.scrollWidth, where + ' scrolls sideways; widest overflow: '
      + JSON.stringify(box.widest)).toBeLessThanOrEqual(box.innerWidth);
  }

  async function expectTouchTargets(page, where) {
    // Every button a finger can reach. Links styled as cards get the same rule.
    const targets = page.locator('button:visible, a.navcard:visible');
    const count = await targets.count();
    expect(count, where + ' shows no buttons at all').toBeGreaterThan(0);
    const boxes = [];
    for (let i = 0; i < count; i++) {
      const el = targets.nth(i);
      const box = await el.boundingBox();
      if (!box) continue; // outside the layout viewport, so not a target here
      box.label = (await el.getAttribute('id')) || (await el.innerText()).slice(0, 24);
      boxes.push(box);
    }
    const issues = touchTargetIssues(boxes).map(function (bad) {
      return bad.reason === 'size'
        ? bad.label + ' is ' + Math.round(bad.box.width) + '×' + Math.round(bad.box.height)
        : bad.label + ' sits ' + bad.gap.toFixed(1) + 'px from ' + bad.other;
    });
    expect(issues, where + ' breaks the ' + TARGET_MIN_PX + 'px target rule').toEqual([]);
  }

  PROFILES.forEach(function (profile) {
    test.describe(profile.name, function () {
      test.use(profile.use);

      test('every tab fits the screen with 44px targets and no console errors', async function ({ page }, testInfo) {
        const errors = [];
        watchConsole(page, errors);
        await page.goto(site.base + 'index.html');
        await expect(page.locator('#tab-remediation')).toBeVisible();

        for (const tab of TABS) {
          await page.locator('#' + tab).click();
          await expect(page.locator('#' + tab)).toHaveAttribute('aria-selected', 'true');
          const where = profile.name + ' · ' + tab;
          await expectNoHorizontalScroll(page, where);
          await expectTouchTargets(page, where);
          // A wide table scrolls inside its own box, not with the page.
          const scrollers = page.locator('.table-scroll:visible');
          for (let i = 0; i < await scrollers.count(); i++) {
            const box = await scrollers.nth(i).boundingBox();
            if (box) expect(box.width).toBeLessThanOrEqual(page.viewportSize().width);
          }
          await testInfo.attach(where + '.png', {
            body: await page.screenshot({ fullPage: true }),
            contentType: 'image/png',
          });
        }
        expect(errors, profile.name + ' logged console errors').toEqual([]);
      });

      test('audio stays locked until the first tap, and a replay button is visible', async function ({ page }) {
        const errors = [];
        watchConsole(page, errors);
        await page.goto(site.base + 'index.html');
        // Nothing has been touched yet: no context, so nothing can have sounded.
        expect(await page.evaluate(function () { return window.audioUnlocked(); })).toBe(false);

        await page.locator('#tab-playground').click();
        await expect.poll(function () {
          return page.evaluate(function () { return window.audioUnlocked(); });
        }, { message: 'pointerdown did not unlock the AudioContext' }).toBe(true);

        // Plan §4.3: a "play again" button, and text when the device is muted.
        await expect(page.locator('#freqPlay')).toBeVisible();
        await expect(page.locator('#rhythmPlay')).toBeVisible();
        await expect(page.locator('#freq')).toContainText('Hz');
        expect(errors).toEqual([]);
      });

      test('one visit is enough: a reload works offline', async function ({ page, context }) {
        await page.goto(site.base + 'index.html');
        await page.waitForFunction(function () {
          return navigator.serviceWorker && navigator.serviceWorker.controller !== null;
        });
        const errors = [];
        watchConsole(page, errors);
        await context.setOffline(true);
        await page.reload();
        await expect(page.locator('#tab-remediation')).toBeVisible();
        await page.locator('#tab-teacherReport').click();
        await expect(page.locator('#reportCard')).toBeVisible();
        await expectNoHorizontalScroll(page, profile.name + ' offline');
        // Offline must not mean a half-loaded page: the scripts answer too.
        expect(await page.evaluate(function () { return typeof window.allItems; })).toBe('function');
        expect(errors, profile.name + ' logged console errors offline').toEqual([]);
        await context.setOffline(false);
      });
    });
  });
}

let pw = null;
try {
  pw = require('@playwright/test');
} catch (e) { /* not installed: see the header */ }
if (pw) {
  try {
    registerSpecs(pw);
  } catch (e) {
    // Playwright is present but we are not under its runner (`node --test`
    // walking test/). test() refuses to register, which is what we want.
  }
}
