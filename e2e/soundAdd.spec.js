// #665 example exercise in a real browser (run by hand, see playwright.config.js):
//   npx --yes playwright@1.49 test --config e2e/playwright.config.js e2e/soundAdd.spec.js --project=phone-390x844
// The sound count is read by wrapping window.playVoice, the one place every
// scheduled note of jamKit.playNotes goes through on the AudioContext. The tap
// latency is read from the first oscillator or buffer source started after a
// pointerdown, which is where musicEngine's tap voices begin.
const { test, expect } = require('@playwright/test');

async function open(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    window.__voices = [];
    window.__nodes = [];
    let real = null;
    Object.defineProperty(window, 'playVoice', {
      configurable: true,
      get() { return real && function (ac, voice, hz, when) { window.__voices.push({ voice, t: performance.now() }); return real.apply(this, arguments); }; },
      set(v) { real = v; },
    });
    const AC = window.AudioContext || window.webkitAudioContext;
    ['createOscillator', 'createBufferSource'].forEach((m) => {
      const orig = AC.prototype[m];
      AC.prototype[m] = function () { window.__nodes.push(performance.now()); return orig.apply(this, arguments); };
    });
    window.addEventListener('pointerdown', () => { window.__down = performance.now(); }, true);
  });
  await page.goto('/exercise.html');
  await expect(page.locator('#saCard .sa-pad')).toBeVisible();
  // A browser that blocks audio before the first touch shows one ▶.
  await page.waitForTimeout(400);
  const start = page.locator('[data-act="start"]');
  if (await start.count()) await start.tap();
  return errors;
}

function drums(page) {
  return page.evaluate(() => window.__voices.filter((v) => /^drum/.test(v.voice)).length);
}

test('the answer pad is above 400px; nothing for the teacher on the child screen', async ({ page }) => {
  const errors = await open(page);
  const box = await page.locator('.sa-pad').boundingBox();
  expect(box.y).toBeLessThan(400);
  const first = await page.evaluate(() => document.querySelector('main').firstElementChild.id);
  expect(first).toBe('saCard');
  await expect(page.locator('body')).not.toContainText('למורה');
  await expect(page.locator('.sa-fam')).toHaveCount(4);
  expect(errors).toEqual([]);
});

test('the first exercise opens with its own sound, one drum per circle, no tap on listen', async ({ page }) => {
  await open(page);
  await expect(page.locator('[data-act="check"]')).toBeVisible();
  const circles = await page.locator('.sa-dot').count();
  await expect.poll(() => drums(page), { timeout: 6000 }).toBe(circles);
  expect(await page.locator('.sa-pad span').innerText()).toBe('0');
});

test('a tap on the pad sounds in under 100 ms', async ({ page }) => {
  await open(page);
  await page.waitForTimeout(3500); // let the opening sound finish
  const ms = [];
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => { window.__nodes = []; });
    await page.locator('.sa-pad').tap();
    ms.push(await page.evaluate(() => { const n = window.__nodes.filter((t) => t >= window.__down); return n.length ? n[0] - window.__down : 9999; }));
  }
  ms.forEach((x) => expect(x).toBeLessThan(100));
});

test('a right answer merges the two groups into one group of the total', async ({ page }) => {
  await open(page);
  const circles = await page.locator('.sa-dot').count();
  for (let i = 0; i < circles; i++) await page.locator('.sa-pad').tap();
  await page.locator('[data-act="check"]').click();
  await expect(page.locator('.sa-dots.sa-merged')).toBeVisible();
  await expect(page.locator('.sa-total')).toHaveText(String(circles));
  await expect(page.locator('.sa-plus')).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-act="next"]')).toBeVisible();
});

test('a wrong answer says almost, keeps the pad active and replays with a count', async ({ page }) => {
  await open(page);
  await page.locator('[data-act="check"]').click();
  await expect(page.locator('.sa-msg')).toContainText('כמעט');
  await expect(page.locator('.sa-pad')).toBeEnabled();
  await expect(page.locator('.sa-missing').first()).toBeVisible();
  await expect(page.locator('.sa-count').first()).toHaveText('1', { timeout: 5000 });
  const words = await page.locator('#saCard').innerText();
  expect(words.replace(/[\d🥁🎹🎸🎷👂👆🎵▶↩←✔+=?:!.,]/gu, ' ').trim().split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(15);
});

test('switching to keys replays the same exercise on keys', async ({ page }) => {
  await open(page);
  const circles = await page.locator('.sa-dot').count();
  await page.waitForTimeout(3500);
  await page.evaluate(() => { window.__voices = []; });
  await page.locator('[data-family="keys"]').tap();
  await expect(page.locator('[data-family="keys"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => window.__voices.filter((v) => v.voice === 'keys').length), { timeout: 5000 }).toBe(circles);
  await expect(page.locator('.sa-pad')).toHaveAttribute('data-tap', 'keys');
});
