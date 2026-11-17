// Phone-only checks (runs in the phone360 project only; see playwright.config.js).
'use strict';
const { test, expect, quickStart } = require('./_fixtures');

test('no page section is wider than the 360px screen on index tabs', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw + 1);
});

test('[M7][MM-719] shared nav links are at least 44px tall on phones', async ({ page }) => {
  test.fail(true, 'M7 open: shared nav links are 15–20px tall');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  const small = await page.$$eval('#mm-site-nav a', (as) => as
    .map((a) => ({ t: a.textContent.trim(), h: Math.round(a.getBoundingClientRect().height) }))
    .filter((a) => a.h > 0 && a.h < 44));
  expect(small).toEqual([]);
});

test('[M5][MM-714] after launch, the question and the answer box are both on screen', async ({ page }) => {
  test.fail(true, 'M5 open: the prompt top is above the viewport after launch');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await quickStart(page, 'א׳');
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const p = document.getElementById('rmPrompt').getBoundingClientRect();
    const a = document.getElementById('rmAnswer').getBoundingClientRect();
    return { pTop: p.top, aBottom: a.bottom, vh: innerHeight };
  });
  expect(r.pTop).toBeGreaterThanOrEqual(0);
  expect(r.aBottom).toBeLessThanOrEqual(r.vh);
});

test('[m10][MM-719] every index tab button is reachable on screen or visibly scrollable', async ({ page }) => {
  test.fail(true, 'm10 open: 3 of 8 tabs sit off-screen in a strip with no scroll affordance');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  const off = await page.$$eval('nav.tabs [id^="tab-"]', (bs) => bs
    .filter((b) => { const r = b.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; })
    .map((b) => b.id));
  expect(off).toEqual([]);
});

// ---------- MM-100 area (blocked until Antigravity finishes MM-100) ----------
test('[M8][MM-100] QR export modal: the close button is on screen at 360px', async ({ page }) => {
  test.fail(true, 'M8 open (MM-100 area): the modal is 872px tall, top=-66px');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.click('#qrShareBtn');
  await page.click('#qrModeExport');
  await page.click('#qrExportStudentBtn');
  const top = await page.evaluate(() => document.getElementById('qrCloseBtn').getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(0);
});
