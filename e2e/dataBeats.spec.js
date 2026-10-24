// #591 DataBeats + PercentMix: pre-test -> 3 practice steps -> post-test,
// results saved under one local key only, no buy/price words, no errors.
// Run by hand like the rest of e2e/ (see playwright.config.js):
//   npx --yes playwright@1.49 test --config e2e/playwright.config.js e2e/dataBeats.spec.js
const { test, expect } = require('@playwright/test');

const card = '#dbCard';

async function takeTest(page, phase) {
  await page.locator(card + ' [data-act="test"][data-phase="' + phase + '"]').click();
  for (let i = 0; i < 12; i++) {
    await expect(page.locator(card)).toContainText('שאלה ' + (i + 1) + ' מתוך 12');
    await expect(page.locator(card + ' [data-act="play"], ' + card + ' [data-tap]')).toHaveCount(0);
    const answer = await page.evaluate(() => { const t = window.MM_DATA_BEATS_SCREEN.handle.state.test; return t.items[t.i].answer; });
    await page.locator(card + ' [data-act="answer"][data-val="' + answer + '"]').click();
  }
  await expect(page.locator(card)).toContainText('נשמר');
  await page.locator(card + ' [data-act="home"]').click();
}

test('pre-test, three practice steps, then the parallel post-test four weeks later', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  await page.waitForFunction(() => window.MM_DATA_BEATS_SCREEN && window.MM_DATA_BEATS_SCREEN.handle);
  const keysBefore = await page.evaluate(() => Object.keys(localStorage).sort());
  await page.locator('#tab-musicGames').click();
  await expect(page.locator(card)).toBeVisible();

  await takeTest(page, 'pre');
  await expect(page.locator(card)).toContainText('בעוד 28 ימים');

  await page.locator(card + ' [data-act="practice"]').click();
  // Steps 1 and 2: hear the graph, then pick the right choice.
  for (let k = 0; k < 3; k++) {
    await page.locator(card + ' [data-act="play"]').click();
    const q = await page.evaluate(() => {
      const S = window.MM_DATA_BEATS_SCREEN; const s = S.handle.state;
      const x = S.questionsFor(s.step, s.round).qs[s.q]; return { kind: x.kind, answer: String(x.answer) };
    });
    await page.locator(card + ' [data-act="' + (q.kind === 'trend' ? 'trend' : 'pick') + '"][data-val="' + q.answer + '"]').click();
    await expect(page.locator(card + ' .jam-msg')).toContainText('נכון');
    await page.locator(card + ' [data-act="next"]').click();
  }
  // Step 3: fill the percent target with the largest tile that still fits.
  await expect(page.locator(card)).toContainText('שלב 3 מתוך 3');
  for (let guard = 0; guard < 20; guard++) {
    const id = await page.evaluate(() => {
      const S = window.MM_DATA_BEATS_SCREEN; const s = S.handle.state;
      if (s.status === 'right') return null;
      const t = S.questionsFor(2, s.round).target;
      const left = t.percent - window.MM_PERCENT_MIX.filled(s.fill);
      return t.allowed.map((a) => window.MM_PERCENT_MIX.tile(a)).sort((a, b) => b.n - a.n).find((x) => x.n <= left).id;
    });
    if (!id) break;
    await page.locator(card + ' [data-act="tile"][data-tile="' + id + '"]').click();
  }
  await expect(page.locator(card + ' .jam-msg')).toContainText('מתוך 100 תת־פעמות');
  await page.locator(card + ' [data-act="next"]').click();
  await expect(page.locator(card)).toContainText('סיימתם את שלושת השלבים');

  // Four weeks later: move the saved pre-test back 28 days and reopen.
  await page.evaluate(() => {
    const k = window.MM_DATA_PERCENT_CHECK.STORAGE_KEY;
    const d = JSON.parse(localStorage.getItem(k));
    d.learners.local.pre.at -= 28 * window.MM_DATA_PERCENT_CHECK.DAY;
    localStorage.setItem(k, JSON.stringify(d));
    window.MM_DATA_BEATS_SCREEN.handle.reload();
  });
  await takeTest(page, 'post');
  await expect(page.locator(card)).toContainText('בעוד 30 ימים');

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem(window.MM_DATA_PERCENT_CHECK.STORAGE_KEY)).learners.local);
  expect(saved.pre.form).toBe('A');
  expect(saved.post.form).toBe('B');
  expect(saved.post.score.total).toBe(12);
  const added = (await page.evaluate(() => Object.keys(localStorage).sort())).filter((k) => keysBefore.indexOf(k) === -1);
  expect(added).toEqual(['mm.dataBeats.check']);
  const text = await page.locator(card).innerText();
  expect(text).not.toMatch(/(^|[^א-ת])(קנה|מחיר|רכישה|מנוי)([^א-ת]|$)/);
  expect(errors).toEqual([]);
});
