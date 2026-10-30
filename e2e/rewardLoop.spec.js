// #591 goal A.4 + #717: a right answer plays the streak melody and is
// counted, but no instrument is locked: the strip has every voice from the
// first exercise and no "new instrument" popup ever shows.
const { test, expect } = require('@playwright/test');

test('a right answer plays the streak melody; every strip voice is there from the start', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('mm.tapProgress.v1', JSON.stringify({ count: 4 }));
      sessionStorage.setItem('seeded', '1');
    }
  });
  await page.goto('/index.html');
  await page.waitForFunction(() => typeof window.playStreakMelody === 'function');
  await page.locator('#rmBegin').click();
  await expect(page.locator('#rmQuiz')).toBeVisible();
  const all = await page.evaluate(() => ALL_TAP_VOICES);
  for (const v of all) await expect(page.locator('#rmQuiz .mm-pad [data-tap="' + v + '"]').first()).toBeAttached();

  // Wrap the engine call (the page calls the global) to see what it played.
  await page.evaluate(() => {
    const orig = window.playStreakMelody;
    window.__rewards = [];
    window.playStreakMelody = (s) => { const r = orig(s); window.__rewards.push({ s, notes: r && r.notes }); return r; };
  });
  const answer = await page.evaluate('String(RM_DIAG[rmIdx].answer)');
  await page.locator('#rmAnswer').fill(answer);
  await page.locator('#rmCheck').tap();
  await expect(page.locator('#rmFeedback')).toHaveClass(/good/);

  const rewards = await page.evaluate(() => window.__rewards);
  expect(rewards.length).toBe(1);
  expect(rewards[0].notes).toBeGreaterThan(0);
  await expect(page.locator('#mmUnlock')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mm.tapProgress.v1')).count)).toBe(5);

  expect(errors).toEqual([]);
});
