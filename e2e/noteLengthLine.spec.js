// #591 NoteLengthLine in the real page: the child opens the music games tab,
// drags the note onto the line, hears the chosen length then the true one,
// orders two notes, and ends on the no-music check.
const { test, expect } = require('@playwright/test');

test('NoteLengthLine: drag, chosen then true length, compare, no-music check', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  await page.locator('#tab-musicGames').click();
  const card = page.locator('#nllCard');
  await page.evaluate(() => { window.__nll = []; const p = window.MM_JAM.playNotes; window.MM_JAM.playNotes = (n, a, b) => { window.__nll.push(n.map((x) => x.dur)); return p(n, a, b); }; });

  await card.locator('[data-line]').fill('600');
  await expect(card.locator('.nll-fill')).toHaveAttribute('style', /width:60%/);
  expect(await page.evaluate(() => window.__nll)).toEqual([[1.2, 1.5]]);
  await expect(card.locator('.jam-msg')).toContainText('קצר מדי');

  const items = await page.evaluate(() => window.MM_NOTE_LENGTH_LINE.itemsForGrade(localStorage.getItem('mm-grade')));
  for (let i = 1; i < items.length; i++) {
    await card.locator('[data-act="next"]').click();
    if (items[i].kind !== 'compare') continue;
    await card.locator('[data-line]').fill('660');
    await card.locator('[data-line]').fill('600');
    await expect(card.locator('.nll-mark')).toHaveCount(2);
  }
  await card.locator('[data-act="next"]').click();
  await expect(card).toContainText('בדיקה בלי מוזיקה');
  await expect(card.locator('[data-tap], [data-act="play"], [data-line]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('?topic=mm-cur-42&screen=1 opens the NoteLengthLine card', async ({ page }) => {
  await page.goto('/index.html?topic=mm-cur-42&screen=1');
  await expect(page.locator('#musicGames')).toBeVisible();
  await expect(page.locator('#nllCard [data-line]')).toBeVisible();
});

test('the selected grade picks the line: ה׳ reaches 0-2 after the 0-1 items', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mm-grade', 'ה'));
  await page.goto('/index.html?topic=mm-cur-42&screen=1');
  const card = page.locator('#nllCard');
  const n = await page.evaluate(() => window.MM_NOTE_LENGTH_LINE.itemsForGrade('ד').length);
  for (let i = 0; i < n; i++) await card.locator('[data-act="next"]').click();
  await expect(card.locator('.nll-tick')).toHaveCount(3);
});
