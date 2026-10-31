const { test, expect } = require('@playwright/test');
test.use({ viewport: { width: 360, height: 740 }, hasTouch: true });
test('box volume at 360px: two families within 1s, no double tap, silent round is silent', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone-360x740', '360px');
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    window.__hz = []; window.__n = 0; window.__reward = 0;
    [window.AudioContext, window.webkitAudioContext].forEach((AC) => {
      if (!AC) return; const orig = AC.prototype.createOscillator;
      AC.prototype.createOscillator = function () {
        const o = orig.call(this); window.__n++; const set = o.frequency.setValueAtTime.bind(o.frequency);
        o.frequency.setValueAtTime = (hz, t) => { if (!window.__heard) window.__heard = performance.now(); window.__hz.push(hz); return set(hz, t); };
        return o;
      };
    });
  });
  await page.goto('/index.html?topic=mm-cur-20');
  const btn = page.locator('#rmPlan .snd-play');
  await expect(btn).toBeVisible();
  const t = await page.evaluate(() => performance.now());
  await btn.click();
  await page.waitForFunction(() => window.__heard);
  expect(await page.evaluate((t0) => window.__heard - t0, t)).toBeLessThan(1000);
  expect(await page.evaluate(() => window.__hz)).toEqual(expect.arrayContaining([330, 392]));
  const n = await page.evaluate(() => window.__n);
  await btn.click();
  expect(await page.evaluate(() => window.__n)).toBe(n);
  await page.evaluate(() => ['playTap', 'playStreakMelody', 'playHarmonicReward', 'playLevelTune'].forEach((k) => { const f = window[k]; window[k] = function () { window.__reward++; return f && f.apply(this, arguments); }; }));
  await page.locator('#rmPlanAnswer').fill(await page.evaluate(() => String(rmPlan[rpStep].current.answer)));
  const before = await page.evaluate(() => window.__n);
  await page.locator('#rmPlan .cube-go-alone').click();
  await expect(page.locator('#rmPlan')).toContainText('עכשיו לבד');
  await expect(page.locator('#rmPlan .snd-play')).toHaveCount(0);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => [window.__n, window.__reward])).toEqual([before, 0]);
  expect(errors).toEqual([]);
});
