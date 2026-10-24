// #665 example exercise in a real browser (run by hand, see playwright.config.js):
//   npx --yes playwright@1.49 test --config e2e/playwright.config.js e2e/soundAdd.spec.js --project=phone-390x844
// The sound count is read by wrapping window.playVoice, the one place every
// scheduled note of jamKit.playNotes goes through on the AudioContext.
const { test, expect } = require('@playwright/test');

async function open(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    window.__voices = [];
    let real = null;
    Object.defineProperty(window, 'playVoice', {
      configurable: true,
      get() { return real && function (ac, voice, hz, when) { window.__voices.push({ voice, t: performance.now() }); return real.apply(this, arguments); }; },
      set(v) { real = v; },
    });
  });
  await page.goto('/exercise.html');
  await expect(page.locator('#saCard .sa-pad')).toBeVisible();
  return errors;
}

test('the answer pad is above 400px and nothing sits above the exercise', async ({ page }) => {
  const errors = await open(page);
  const box = await page.locator('.sa-pad').boundingBox();
  expect(box.y).toBeLessThan(400);
  const first = await page.evaluate(() => document.querySelector('main').firstElementChild.id);
  expect(first).toBe('saCard');
  expect(errors).toEqual([]);
});

test('after the worked example, the next exercise is heard as one drum per circle within a second', async ({ page }) => {
  await open(page);
  await page.locator('.sa-pad').tap();
  await page.locator('[data-act="check"]').click();
  await expect(page.locator('.sa-msg')).toContainText('כל הכבוד');
  await page.locator('[data-act="next"]').click();
  const item = await page.evaluate(() => [...document.querySelectorAll('.sa-dot')].length);
  await page.evaluate(() => { window.__voices = []; window.__t0 = performance.now(); });
  await page.locator('[data-act="listen"]').click();
  await expect.poll(() => page.evaluate(() => window.__voices.filter((v) => /^drum/.test(v.voice)).length)).toBe(item);
  const firstMs = await page.evaluate(() => window.__voices[0].t - window.__t0);
  expect(firstMs).toBeLessThan(1000);
});

test('a wrong answer keeps the pad active and offers the counted replay', async ({ page }) => {
  await open(page);
  await page.locator('.sa-pad').tap();
  await page.locator('[data-act="check"]').click();
  await page.locator('[data-act="next"]').click();
  await page.locator('[data-act="check"]').click();
  await expect(page.locator('.sa-pad')).toBeEnabled();
  await expect(page.locator('.sa-missing').first()).toBeVisible();
  await expect(page.locator('[data-act="listen"]')).toBeVisible();
  const words = await page.locator('#saCard').innerText();
  expect(words.replace(/[\d🥁▶↩←+=?]/gu, ' ').trim().split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(15);
});
