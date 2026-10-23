// #591 InstrumentStudio: start a topic, pick the marimba, answer, a streak of
// 5 opens a choice, switch to the darbuka; the topic's musical way stays the
// same, nothing on screen sells anything, and a tap sounds in under 50 ms.
// Run by hand like the rest of e2e/ (see playwright.config.js).
const { test, expect } = require('@playwright/test');

test('choose an instrument at the defined moments; the method never changes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  await page.waitForFunction(() => window.MM_INSTRUMENT_STUDIO && typeof window.audioState === 'function');
  await page.evaluate(() => localStorage.removeItem('mm.studio'));
  await page.reload();
  await page.locator('#tab-musicGames').click();
  const card = page.locator('#studioCard');
  await expect(card).toBeVisible();
  await expect(card.locator('.st-choice')).toHaveCount(0);
  await card.locator('#stTopic').selectOption('fractions');
  const method = await card.locator('.st-method').innerText();
  await card.locator('[data-act="start"]').click();
  await expect(card.locator('.st-choice [data-act="choose"]')).toHaveCount(4);
  await card.locator('[data-act="choose"][data-id="marimba"]').click();
  await expect(card.locator('.st-now')).toContainText('מרימבה');
  await expect(card.locator('.st-choice')).toHaveCount(0);
  await expect(card.locator('.st-method')).toHaveText(method);

  // Four answers: no choice yet. The fifth in a row opens one.
  for (let i = 0; i < 5; i++) {
    await expect(card.locator('.st-choice')).toHaveCount(0);
    await page.evaluate((n) => window.dispatchEvent(new CustomEvent('mm:answer', { detail: { correct: true, topic: 't' + n } })), i);
  }
  await expect(card.locator('#stChoiceHead')).toContainText('רצף');
  await card.locator('[data-act="choose"][data-id="darbuka"]').click();
  await expect(card.locator('.st-now')).toContainText('דרבוקה');
  await expect(card.locator('.st-method')).toHaveText(method);

  // The darbuka's dum sounds on pointerdown within the budget.
  const dum = card.locator('.st-dum');
  await dum.tap(); // first gesture unlocks the AudioContext
  await expect.poll(() => page.evaluate(() => window.audioState())).toBe('running');
  const before = await page.evaluate(() => window.audioState.taps);
  await dum.tap();
  const r = await page.evaluate(() => ({ taps: window.audioState.taps, ms: window.audioState.lastStart - window.audioState.lastEventTime }));
  expect(r.taps).toBe(before + 1);
  expect(r.ms).toBeLessThan(50);

  await expect(card).not.toContainText(/קנה|מחיר|רכישה|מנוי|תשלום/);
  expect(errors).toEqual([]);
});

test('every instrument sounds on pointerdown within 50 ms', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => window.MM_STUDIO && typeof window.audioState === 'function');
  const ids = await page.evaluate(() => window.MM_STUDIO.PROFILES.map((x) => x.id));
  for (const id of ids) {
    // Progress that opened all 24, with this instrument chosen.
    await page.evaluate((cur) => localStorage.setItem('mm.studio', JSON.stringify({
      correct: Object.fromEntries(Array.from({ length: 18 }, (_, i) => ['t' + i, 5])), streak: 0, current: cur, choices: 0,
      opened: window.MM_STUDIO.PROFILES.map((x) => x.id) })), id);
    await page.reload();
    await page.locator('#tab-musicGames').click();
    const note = page.locator('#studioCard .st-surface [data-note]').first();
    await note.tap();
    await expect.poll(() => page.evaluate(() => window.audioState())).toBe('running');
    const before = await page.evaluate(() => window.audioState.taps);
    await note.tap();
    const r = await page.evaluate(() => ({ taps: window.audioState.taps, ms: window.audioState.lastStart - window.audioState.lastEventTime }));
    expect(r.taps, id).toBe(before + 1);
    expect(r.ms, id).toBeLessThan(50);
  }
});
