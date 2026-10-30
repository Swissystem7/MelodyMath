// #591 TempoRuler: pre-test -> 3 practice steps -> post-test, in the page.
// The post-test opens 4 weeks after the pre-test, so the test moves the stored
// pre-test date back 28 days and reloads the screen's record.
// Run by hand like the rest of e2e/ (see playwright.config.js):
//   npx --yes playwright@1.49 test --config e2e/playwright.config.js e2e/tempoRuler.spec.js
const { test, expect } = require('@playwright/test');

const CARD = '#trCard';

async function answerTest(page, wrongIds) {
  for (let i = 0; i < 12; i++) {
    const it = await page.evaluate(() => { const s = window.MM_TEMPO_RULER_SCREEN.handle.state; return s.form[s.i]; });
    const pick = wrongIds.includes(it.id) ? it.choices.find((c) => c !== it.answer) : it.answer;
    await page.locator(CARD + ' [data-act="opt"][data-opt="' + pick + '"]').click();
  }
}

test('pre-test, three steps, post-test after 4 weeks, effect size on unpractised items', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.removeItem('mm.tempoRuler.measure'));
  await page.reload();
  await page.waitForFunction(() => window.MM_TEMPO_RULER_SCREEN && window.MM_TEMPO_RULER_SCREEN.handle);
  await page.locator('#tab-musicGames').click();
  await expect(page.locator(CARD)).toContainText('סרגל הטמפו');

  // Pre-test: 12 silent items, three transfer items wrong.
  await page.locator(CARD + ' [data-act="start"]').click();
  await expect(page.locator(CARD)).toContainText('מבחן פתיחה');
  await expect(page.locator(CARD + ' [data-tap]')).toHaveCount(0);
  await answerTest(page, ['t8', 't9', 't10']);

  // Three practice steps.
  const seen = new Set();
  for (let guard = 0; guard < 20; guard++) {
    const s = await page.evaluate(() => { const h = window.MM_TEMPO_RULER_SCREEN.handle.state; return { view: h.view, step: h.step }; });
    if (s.view !== 'practice') break;
    seen.add(s.step);
    if (s.step === 0) await page.locator(CARD + ' [data-act="stick"][data-stick="beat"]').click();
    const right = await page.evaluate(() => String(window.MM_TEMPO_RULER_SCREEN.currentAnswer(window.MM_TEMPO_RULER_SCREEN.handle.state)));
    await page.locator(CARD + ' [data-act="ans"][data-v="' + right + '"]').click();
    await expect(page.locator(CARD + ' .jam-msg')).toContainText('נכון');
    await page.locator(CARD + ' [data-act="next"]').click();
  }
  expect([...seen].sort()).toEqual([0, 1, 2]);
  await expect(page.locator(CARD)).toContainText('סיימתם את שלושת השלבים');
  await expect(page.locator(CARD)).toContainText('מבחן הסיום ייפתח בעוד 28 ימים');

  // Four weeks later.
  await page.evaluate(() => {
    const r = JSON.parse(localStorage.getItem('mm.tempoRuler.measure'));
    r.pre.at -= 28 * 24 * 60 * 60 * 1000;
    localStorage.setItem('mm.tempoRuler.measure', JSON.stringify(r));
    window.MM_TEMPO_RULER_SCREEN.handle.reload();
  });
  await page.locator(CARD + ' [data-act="start"]').click();
  await expect(page.locator(CARD)).toContainText('מבחן סיום');
  await answerTest(page, []);
  await expect(page.locator(CARD)).toContainText('d = ');
  await expect(page.locator(CARD)).toContainText('הבדיקה אחרי 30 יום עוד לא נעשתה');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('mm.tempoRuler.measure')));
  expect(stored.pre.score.unpractised).toBeCloseTo(0.4);
  expect(stored.post.score.unpractised).toBe(1);
  const text = await page.locator(CARD).innerText();
  expect(text).not.toMatch(/(^|[^א-ת])(קנה|מחיר|רכישה|מנוי)([^א-ת]|$)/);
  expect(errors).toEqual([]);
});
