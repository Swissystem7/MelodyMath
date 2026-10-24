// #591 goal A.4: the reward loop in the real page. A right answer plays the
// streak melody and counts toward the next strip instrument; the fifth right
// answer on this device unlocks the clap, announced politely, and the strip
// of the next exercise has it as a new key.
const { test, expect } = require('@playwright/test');

test('a right answer plays the streak melody and unlocks an instrument for the strip', async ({ page }) => {
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
  await expect(page.locator('#rmQuiz .mm-pad .mm-pad-new')).toHaveCount(0);

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
  await expect(page.locator('#mmUnlock')).toBeVisible();
  await expect(page.locator('#mmUnlock')).toHaveAttribute('role', 'status');
  await expect(page.locator('#mmUnlock')).toContainText('מחיאת כף');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mm.tapProgress.v1')).count)).toBe(5);

  await page.locator('#rmNext').click();
  const fresh = page.locator('#rmQuiz .mm-pad .mm-pad-new');
  await expect(fresh).toHaveCount(1);
  await expect(fresh).toHaveAttribute('data-tap', 'clap');
  expect(errors).toEqual([]);
});
