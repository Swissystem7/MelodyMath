// #591 RhythmMaster (owner comment 6376159285): the e2e the spec asks for,
// pre-test -> 3 practice steps (answer + reason) -> parallel post-test, in
// the real page on the viewports of playwright.config.js. Run by hand like
// the rest of e2e/ (never part of node --test):
//
//   npx --yes playwright@1.49 test --config e2e/playwright.config.js e2e/rhythmMaster.spec.js
//
// The right answers are read from the screen's own state
// (window.MM_RHYTHM_MASTER_UI.handle.state), so the test does not hard-code
// the forms; node --test covers the maths.
const { test, expect } = require('@playwright/test');

function state(page) {
  return page.evaluate(() => {
    const s = window.MM_RHYTHM_MASTER_UI.handle.state;
    return {
      phase: s.phase,
      sub: s.sub,
      test: s.test ? { index: s.test.index, answer: s.test.items[s.test.index].answer, total: s.test.items.length } : null,
      task: s.task ? { answer: s.task.answer, reasonId: s.task.reasonId, kind: s.task.kind } : null,
      steps: s.record.steps,
      pre: s.record.pre ? s.record.pre.score.correct : null,
      post: s.record.post ? s.record.post.score.correct : null,
    };
  });
}

test('RhythmMaster: 12-item pre-test, 3 steps with a reason each, then the post-test', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  await page.evaluate(() => { try { localStorage.removeItem('mm.rhythmMaster.measure'); localStorage.removeItem('mm.rhythmMaster.adapt'); } catch (e) { /* private */ } });
  await page.reload();
  await page.locator('#tab-musicGames').click();
  const card = page.locator('#rmCard');
  await expect(card).toBeVisible();
  await card.locator('[data-act="start-test"][data-phase="pre"]').click();

  for (let i = 0; i < 12; i++) {
    const s = await state(page);
    expect(s.phase).toBe('pre');
    await expect(card).toContainText('שאלה ' + (i + 1) + ' מתוך 12');
    await expect(card.locator('[data-tap], [data-act="play"]')).toHaveCount(0);
    await card.locator('[data-act="test"][data-value="' + s.test.answer + '"]').click();
  }
  expect((await state(page)).pre).toBe(12);

  const kinds = [];
  for (let step = 0; step < 3; step++) {
    const s = await state(page);
    expect(s.phase).toBe('practice');
    kinds.push(s.task.kind);
    await card.locator('[data-act="answer"][data-value="' + s.task.answer + '"]').click();
    await expect(card).toContainText('למה?');
    await card.locator('[data-act="reason"][data-id="' + s.task.reasonId + '"]').click();
    await expect(card.locator('.jam-msg')).toContainText('נימוק נכון');
    if (step < 2) await card.locator('[data-act="next"]').click();
  }
  expect(kinds).toEqual(['lcm', 'ratio', 'fraction']);
  expect((await state(page)).steps).toBe(3);

  // Taken today, so it is marked early (the screen says 4 weeks).
  await expect(card).toContainText('4 שבועות');
  await card.locator('[data-act="start-test"][data-phase="post"]').click();
  for (let i = 0; i < 12; i++) {
    const s = await state(page);
    expect(s.phase).toBe('post');
    await card.locator('[data-act="test"][data-value="' + s.test.answer + '"]').click();
  }
  const end = await state(page);
  expect(end.phase).toBe('summary');
  expect(end.post).toBe(12);
  await expect(card).toContainText('לא ניסוי מבוקר');
  await expect(card).toContainText('מוקדם');
  expect(errors).toEqual([]);
});
