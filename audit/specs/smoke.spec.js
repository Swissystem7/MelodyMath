// What already works (audit §1 "What already works"). These must stay green.
'use strict';
const { test, expect, PAGES, TABS, collectErrors, quickStart, answerItems } = require('./_fixtures');

test.describe('pages', () => {
  for (const p of PAGES) {
    test(`${p} loads: 200, lang=he, dir=rtl, no JS errors, no horizontal scroll`, async ({ page }) => {
      const errors = collectErrors(page);
      const resp = await page.goto(p, { waitUntil: 'networkidle' });
      expect(resp.status()).toBe(200);
      expect(await page.getAttribute('html', 'lang')).toBe('he');
      expect(await page.getAttribute('html', 'dir')).toBe('rtl');
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(sw, 'horizontal scroll').toBeLessThanOrEqual(cw + 1);
      expect(errors.filter((e) => !/AudioContext was not allowed/.test(e))).toEqual([]);
    });
  }
});

test('index: every open tab shows a non-empty panel without errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('index.html', { waitUntil: 'networkidle' });
  for (const t of TABS) {
    await page.click('#tab-' + t);
    await expect(page.locator('#' + t)).toBeVisible();
    expect((await page.locator('#' + t).innerText()).trim().length, t).toBeGreaterThan(100);
  }
  expect(errors).toEqual([]);
});

test('index: the teacher tab is behind the adult gate', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.click('#tab-teacherReport');
  await expect(page.locator('#adultGate')).toBeVisible();
  await expect(page.locator('#teacherReport')).toBeHidden();
});

test('program.html deep link opens targeted practice on index', async ({ page }) => {
  await page.goto('index.html?topic=mm-cur-3&skill=addition', { waitUntil: 'networkidle' });
  await expect(page.locator('#rmPlan')).toBeVisible();
  await expect(page.locator('#rmPlanPrompt')).not.toBeEmpty();
});

test('quick start reaches the first question for grade 2', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await quickStart(page, 'ב׳');
  await expect(page.locator('#rmPrompt')).not.toBeEmpty();
});

test('PWA: manifest is valid and its icons resolve', async ({ page, request }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  const href = await page.getAttribute('link[rel=manifest]', 'href');
  expect(href).toBeTruthy();
  const murl = new URL(href, page.url()).href;
  const m = await (await request.get(murl)).json();
  expect(m.name).toBeTruthy();
  expect(m.start_url).toBeTruthy();
  expect(m.display).toBe('standalone');
  expect(m.lang).toBe('he');
  expect(m.dir).toBe('rtl');
  expect(m.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  for (const ic of m.icons) expect((await request.get(new URL(ic.src, murl).href)).status(), ic.src).toBe(200);
});

test('PWA: the service worker takes control and index/check/program reload offline', async ({ page, context }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15000 }).toBe(true);
  // Let the precache finish before going offline.
  await expect.poll(() => page.evaluate(async () => {
    const keys = await caches.keys();
    let n = 0;
    for (const k of keys) n += (await (await caches.open(k)).keys()).length;
    return n;
  }), { timeout: 30000 }).toBeGreaterThan(50);
  await context.setOffline(true);
  try {
    for (const p of ['index.html', 'check.html', 'program.html']) {
      const op = await context.newPage();
      const resp = await op.goto(p);
      expect(resp && resp.ok(), p).toBeTruthy();
      await expect(op.locator('h1').first()).toBeVisible();
      await op.close();
    }
    await page.reload();
    await quickStart(page, 'א׳');
  } finally {
    await context.setOffline(false);
  }
});

test('progress with a class code and name is saved and survives reload', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.fill('#classCode', 'AUDIT-TEST');
  await page.fill('#studentName', 'kid-1');
  await page.click('#whoSave');
  await quickStart(page, 'א׳');
  await answerItems(page, 2);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#studentName')).toHaveValue('kid-1');
  const roster = await page.evaluate(() => JSON.parse(localStorage.getItem('mm-roster-v1:AUDIT-TEST')));
  expect(roster.students['kid-1'].sessions.length).toBeGreaterThan(0);
});
