// #591 RhythmPolygon: pre-test -> 3 practice steps -> post-test in a real
// browser (owner comments 6376161263 + 6376159285). The 4-week wait is
// skipped by moving the stored pre-test date back 29 days.
// Run by hand like the rest of e2e/ (see playwright.config.js):
//   npx --yes playwright@1.49 test --config e2e/playwright.config.js e2e/rhythmPolygon.spec.js
const { test, expect } = require('@playwright/test');

const card = '#rpCard';
const item = (page) => page.evaluate(() => {
  const S = window.MM_RHYTHM_POLYGON_SCREEN;
  const it = S.currentItem(S.handle.state);
  return { phase: S.handle.state.phase, answer: it ? it.answer : null, other: it ? it.choices.find((c) => c !== it.answer) : null };
});

// wrong: item indexes answered wrong, so the pre-test has a spread to measure against.
async function answerTest(page, phase, wrong) {
  for (let i = 0; i < 12; i++) {
    const it = await item(page);
    expect(it.phase).toBe(phase);
    await page.locator(card + ' [data-act="test"][data-opt="' + ((wrong || []).includes(i) ? it.other : it.answer) + '"]').click();
  }
}

test('pre-test, three steps and the parallel post-test; results stay under one local key', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  await page.waitForFunction(() => window.MM_RHYTHM_POLYGON_SCREEN && window.MM_RHYTHM_POLYGON_SCREEN.handle);
  const keysBefore = await page.evaluate(() => Object.keys(localStorage).sort());
  await page.locator('#tab-musicGames').click();

  await page.locator(card + ' [data-act="choose"][data-inst="marimba"]').click();
  await expect(page.locator(card)).toContainText('בדיקת פתיחה');
  await expect(page.locator(card + ' [data-act="music"]')).toHaveCount(0);
  await answerTest(page, 'pre', [1, 3]);

  for (const step of ['שלב 1 · צלעות', 'שלב 2 · זוויות', 'שלב 3 · סימטריה וסיבוב']) {
    await expect(page.locator(card + ' h3')).toContainText(step);
    for (let i = 0; i < 4; i++) {
      const it = await item(page);
      await page.locator(card + ' [data-act="step"][data-opt="' + it.answer + '"]').click();
      await expect(page.locator(card + ' .jam-msg')).toContainText('נכון');
      await page.locator(card + ' [data-act="next"]').click();
    }
  }
  await expect(page.locator(card)).toContainText('הבדיקה הבאה תיפתח בעוד');
  await expect(page.locator(card + ' svg.rp-clock')).toHaveCount(0);

  await page.evaluate(() => {
    const rec = JSON.parse(localStorage.getItem('mm.polygon.check'));
    rec.pre.at -= 29 * 864e5;
    localStorage.setItem('mm.polygon.check', JSON.stringify(rec));
  });
  await page.locator(card + ' [data-act="refresh"]').click();
  await expect(page.locator(card)).toContainText('בדיקת סיום');
  await answerTest(page, 'post');
  await expect(page.locator(card)).toContainText('שינוי בפריטים שלא תורגלו');

  const rec = await page.evaluate(() => JSON.parse(localStorage.getItem('mm.polygon.check')));
  expect(rec.pre.form).toBe('A');
  expect(rec.post.form).toBe('B');
  expect(rec.post.results).toHaveLength(12);
  const keysAfter = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(keysAfter.filter((k) => keysBefore.indexOf(k) === -1)).toEqual(['mm.polygon.check']);
  const text = await page.locator(card).innerText();
  expect(text).not.toMatch(/(^|[^א-ת])(קנה|מחיר|רכישה|מנוי)([^א-ת]|$)/);
  expect(errors).toEqual([]);
});
