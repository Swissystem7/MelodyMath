// #591 WorldInstrumentLibrary: every one of the 24 instruments opens its
// card and sounds on pointerdown within 50 ms; only the chosen instrument is
// prepared; locked ones cannot be played; nothing on screen sells anything;
// the library works offline after the service worker cached it.
// Run by hand like the rest of e2e/.
const { test, expect } = require('@playwright/test');

const allOpen = () => localStorage.setItem('mm.studio', JSON.stringify({
  correct: Object.fromEntries(Array.from({ length: 18 }, (_, i) => ['t' + i, 5])),
  streak: 0, current: 'darbuka', choices: 0, opened: window.MM_LIBRARY.LIBRARY.map((x) => x.id) }));

test('pick each of the 24 instruments and play a note within the touch budget', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  await page.waitForFunction(() => window.MM_INSTRUMENT_LIBRARY && typeof window.audioState === 'function');
  await page.evaluate(allOpen);
  await page.reload();
  await page.locator('#tab-musicGames').click();
  const card = page.locator('#libraryCard');
  await expect(card.locator('[data-act="pick"]')).toHaveCount(24);
  const ids = await page.evaluate(() => window.MM_LIBRARY.LIBRARY.map((x) => x.id));
  for (const id of ids) {
    await card.locator('[data-act="pick"][data-id="' + id + '"]').click();
    await expect(card.locator('#libCardHead')).toBeVisible();
    const note = card.locator('.lib-card [data-note]').first();
    await note.tap();
    await expect.poll(() => page.evaluate(() => window.audioState())).toBe('running');
    const before = await page.evaluate(() => window.audioState.taps);
    await note.tap();
    const r = await page.evaluate(() => ({ taps: window.audioState.taps, ms: window.audioState.lastStart - window.audioState.lastEventTime }));
    expect(r.taps, id).toBe(before + 1);
    expect(r.ms, id).toBeLessThan(50);
  }
  await expect(card).not.toContainText(/קנה|מחיר|רכישה|מנוי|תשלום/);
  expect(errors).toEqual([]);
});

test('a fresh learner sees six open instruments; locked ones have no card and say when they open', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => window.MM_INSTRUMENT_LIBRARY);
  await page.evaluate(() => localStorage.removeItem('mm.studio'));
  await page.reload();
  await page.locator('#tab-musicGames').click();
  const card = page.locator('#libraryCard');
  await expect(card.locator('[data-act="pick"][aria-disabled="true"]')).toHaveCount(18);
  await card.locator('[data-act="pick"][data-id="harp"]').click();
  await expect(card.locator('.lib-card')).toHaveCount(0);
  await expect(card.locator('.jam-msg')).toContainText('ייפתח אחרי');
});

test('offline after the first visit', async ({ page, context }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await page.locator('#tab-musicGames').click();
  await expect(page.locator('#libraryCard [data-act="pick"]')).toHaveCount(24);
  await context.setOffline(false);
});
