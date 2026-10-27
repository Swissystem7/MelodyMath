// #591 LoopStack in the real page: the child opens the music games tab,
// plays the stack of loop layers, solves every box and ends on the no-music check.
const { test, expect } = require('@playwright/test');

test('LoopStack opens from the menu, plays, and ends with a no-music check', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  await page.locator('#tab-musicGames').click();
  const card = page.locator('#lsCard');
  await expect(card.locator('.ls-layer')).toHaveCount(2);

  await page.evaluate(() => { window.__ls = []; const p = window.MM_JAM.playNotes; window.MM_JAM.playNotes = (n, a, b) => { window.__ls.push(n.length); return p(n, a, b); }; });
  await card.locator('[data-act="play"]').click();
  expect(await page.evaluate(() => window.__ls)).toEqual([12]);

  for (const t of await page.evaluate(() => window.MM_LOOP_STACK.TARGETS)) {
    await card.locator('[data-answer]').fill(String(t.a * t.b * t.c));
    await card.locator('[data-act="check"]').click();
    await expect(card.locator('.jam-msg')).toHaveClass(/good/);
    await card.locator('[data-act="next"]').click();
  }
  await expect(card).toContainText('בדיקה בלי מוזיקה');
  await expect(card.locator('[data-tap], [data-act="play"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('?topic=mm-cur-56&screen=1 opens the LoopStack card', async ({ page }) => {
  await page.goto('/index.html?topic=mm-cur-56&screen=1');
  await expect(page.locator('#musicGames')).toBeVisible();
  await expect(page.locator('#lsCard .ls-layer').first()).toBeVisible();
});
