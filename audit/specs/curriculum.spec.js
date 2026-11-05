// Curriculum gaps from docs/MM-700/curriculum-gaps.md, measured in the browser
// on the shipped bank (allItems / itemsForTopic / getAllLessons globals).
// Desktop project only. Threshold 12 = MM-501's "thin row" line (G2/G12).
'use strict';
const { test, expect } = require('./_fixtures');

test.beforeEach(async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
});

const count = (page, id) => page.evaluate((t) => itemsForTopic(t, allItems()).length, id);
const levels = (page, id) => page.evaluate((t) => {
  const c = { 1: 0, 2: 0, 3: 0 };
  itemsForTopic(t, allItems()).forEach((i) => { c[i.level] = (c[i.level] || 0) + 1; });
  return c;
}, id);

// ---------- guards that must stay green ----------
test('the bank still has at least 1,296 items and every MATRIX row has items', async ({ page }) => {
  const r = await page.evaluate(() => {
    const all = allItems();
    const ids = [...new Set(MATRIX.map((row) => row.topicId).filter(Boolean))];
    return { n: all.length, rows: ids.length, empty: ids.filter((id) => itemsForTopic(id, all).length === 0) };
  });
  expect(r.n).toBeGreaterThanOrEqual(1296);
  expect(r.rows).toBeGreaterThan(0);
  expect(r.empty).toEqual([]);
});

// ---------- grades 1–3 (MM-731 … MM-739) ----------
test('[G9][MM-731] grade 1 whole tens (mm-cur-4) has ≥4 basis and ≥4 intermediate items', async ({ page }) => {
  test.fail(true, 'G9 open: all 9 items are challenge level');
  const l = await levels(page, 'mm-cur-4');
  expect(l[1]).toBeGreaterThanOrEqual(4);
  expect(l[2]).toBeGreaterThanOrEqual(4);
});

for (const id of ['mm-cur-9', 'mm-cur-11']) {
  test(`[G2][MM-732] grade 1 ${id} has ≥12 items with every level present`, async ({ page }) => {
    test.fail(true, `G2 open: ${id} has 6 items`);
    const l = await levels(page, id);
    expect(l[1] + l[2] + l[3]).toBeGreaterThanOrEqual(12);
    expect(Math.min(l[1], l[2], l[3])).toBeGreaterThan(0);
  });
}

test('[G2][MM-733] grade 1 whole-hour clock (mm-cur-10) has ≥12 items — MM-100 area (clock)', async ({ page }) => {
  test.fail(true, 'G2 open: 6 clock items');
  expect(await count(page, 'mm-cur-10')).toBeGreaterThanOrEqual(12);
});

test('[G3/G5][MM-734] every guided lesson has a topicId, and one covers mm-cur-3 — MM-100 area (lessons)', async ({ page }) => {
  test.fail(true, 'G3/G5 open: no lesson has a topicId');
  const r = await page.evaluate(() => getAllLessons().map((l) => l.topicId || null));
  expect(r.filter((t) => !t)).toEqual([]);
  expect(r).toContain('mm-cur-3');
});

test('[partial][MM-738] grade 3 has ≥8 items on a drawn clock — MM-100 area (clock)', async ({ page }) => {
  test.fail(true, 'mm-cur-28 open: the clock widget is used only in grades א–ב');
  const n = await page.evaluate(() => allItems().filter((i) => i.grade === 'ג' && i.widget === 'clock').length);
  expect(n).toBeGreaterThanOrEqual(8);
});

test('[G2/G9][MM-739] grade 3 agorot (mm-cur-29) ≥12 items and grade 2 division (mm-cur-16) ≥6 challenge items', async ({ page }) => {
  test.fail(true, 'G2/G9 open: mm-cur-29 has 8 items; mm-cur-16 has 2 challenge items');
  expect(await count(page, 'mm-cur-29')).toBeGreaterThanOrEqual(12);
  expect((await levels(page, 'mm-cur-16'))[3]).toBeGreaterThanOrEqual(6);
});

// ---------- grades 4–6 (MM-740 … MM-748) ----------
for (const id of ['mm-cur-41', 'mm-cur-42', 'mm-cur-43']) {
  test(`[G2][MM-740] grade 5 fractions ${id} has ≥12 items`, async ({ page }) => {
    test.fail(true, `G2 open: ${id} is thin (4–8 items)`);
    expect(await count(page, id)).toBeGreaterThanOrEqual(12);
  });
}

test('[G3][MM-741] a guided lesson covers grade 5 expanding/simplifying (mm-cur-41) — MM-100 area (lessons)', async ({ page }) => {
  test.fail(true, 'G3 open: no lesson for mm-cur-41');
  expect(await page.evaluate(() => getAllLessons().some((l) => l.topicId === 'mm-cur-41'))).toBe(true);
});

for (const id of ['mm-cur-36', 'mm-cur-38']) {
  test(`[G2][MM-742] ${id} has ≥12 items`, async ({ page }) => {
    test.fail(true, `G2 open: ${id} is thin`);
    expect(await count(page, id)).toBeGreaterThanOrEqual(12);
  });
}

test('[G9/G2][MM-747] level balance: mm-cur-32 and mm-cur-55 ≥6 challenge items, mm-cur-57 ≥12 items', async ({ page }) => {
  test.fail(true, 'G9/G2 open: 2 challenge items each; mean has 10 items');
  expect((await levels(page, 'mm-cur-32'))[3]).toBeGreaterThanOrEqual(6);
  expect((await levels(page, 'mm-cur-55'))[3]).toBeGreaterThanOrEqual(6);
  expect(await count(page, 'mm-cur-57')).toBeGreaterThanOrEqual(12);
});
