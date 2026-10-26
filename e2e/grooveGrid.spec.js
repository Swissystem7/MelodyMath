// #591 GrooveGrid in the real page: the child opens the music games tab,
// plays the grid, solves every exercise and ends on the no-music check.
const { test, expect } = require('@playwright/test');

test('GrooveGrid opens from the menu, plays, and ends with a no-music check', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  await page.locator('#tab-musicGames').click();
  const card = page.locator('#ggCard');
  await expect(card.locator('.gg-cell')).toHaveCount(12);

  await page.evaluate(() => { window.__gg = []; const p = window.MM_JAM.playNotes; window.MM_JAM.playNotes = (n, a, b) => { window.__gg.push(n.length); return p(n, a, b); }; });
  await card.locator('[data-act="playArea"]').click();
  expect(await page.evaluate(() => window.__gg)).toEqual([12]);

  for (const t of await page.evaluate(() => window.MM_GROOVE_GRID.TARGETS)) {
    const want = t.ask === 'area' ? t.rows * t.cols : 2 * (t.rows + t.cols);
    await card.locator('[data-answer]').fill(String(want));
    await card.locator('[data-act="check"]').click();
    await expect(card.locator('.jam-msg')).toHaveClass(/good/);
    await card.locator('[data-act="next"]').click();
  }
  await expect(card).toContainText('בדיקה בלי מוזיקה');
  await expect(card.locator('[data-tap]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('?topic=mm-cur-47&screen=1 opens the GrooveGrid card', async ({ page }) => {
  await page.goto('/index.html?topic=mm-cur-47&screen=1');
  await expect(page.locator('#musicGames')).toBeVisible();
  await expect(page.locator('#ggCard .gg-cell').first()).toBeVisible();
});
