// #591 SetlistGoal in the real page: the child picks "שיר קצר", solves 4 items
// and hears the whole 4-box song on the child's instrument.
const { test, expect } = require('@playwright/test');

test('a child picks a short song, solves 4 items and hears the full song', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  await page.waitForFunction(() => typeof window.MM_SETLIST_GOAL === 'object');
  await expect(page.locator('#setlistBody [data-goal="short"]')).toContainText('מוצע');
  await page.locator('#setlistBody [data-goal="short"]').click();
  await expect(page.locator('#setlistBody .sg-box')).toHaveCount(4);

  await page.evaluate(() => {
    const S = window.MM_MASTERY_STREAK, orig = S.playPhrase;
    window.__songs = [];
    S.playPhrase = (p, i, ac, d) => { window.__songs.push(p && p.id === 'setlist' ? p.notes.length : 0); return orig(p, i, ac, d); };
  });
  await page.locator('#rmBegin').click();
  for (let i = 0; i < 4; i++) {
    const answer = await page.evaluate('String(RM_DIAG[rmIdx].answer)');
    await page.locator('#rmAnswer').fill(answer);
    await page.locator('#rmCheck').click();
    await expect(page.locator('#rmFeedback')).toHaveClass(/good/);
    if (i < 3) {
      await expect(page.locator('#setlistBody .sg-box.on')).toHaveCount(i + 1);
      await page.locator('#rmNext').click();
    }
  }
  expect(await page.evaluate(() => window.__songs)).toEqual([4]);
  await expect(page.locator('#setlistSay')).toContainText('השיר הושלם ונשמר');
  await expect(page.locator('#setlistBody [data-goal-replay]')).toBeVisible();
  expect(errors).toEqual([]);
});
