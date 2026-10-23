// #591 goal A: a tap on a musical element starts its sound in under 50 ms,
// on the tablet and phone viewports of playwright.config.js.
//
// What is measured: the pointerdown event's timeStamp (when the browser
// received the touch) to window.audioState.lastStart (performance.now() when
// the oscillator was started on ac.currentTime). That is the whole JS path
// the page controls; the device's own output buffer (ac.outputLatency) comes
// on top and is reported in the attachment, not asserted.
//
// Run it with --workers=1: parallel browsers on one laptop share the CPU and
// delay input delivery itself (seen locally: 50.6 ms once with 2 workers,
// 48/48 green with 1).
const { test, expect } = require('@playwright/test');

const BUDGET_MS = 50;

async function openPlayground(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  await page.waitForFunction(() => typeof window.audioState === 'function' && typeof window.installTapFeedback === 'function');
  await page.locator('#tab-playground').click();
  await expect(page.locator('#xk_0')).toBeVisible();
  // The first gesture unlocks (pre-warms) the one AudioContext.
  await page.locator('#xk_0').tap();
  await expect.poll(() => page.evaluate(() => window.audioState())).toBe('running');
  return errors;
}

function latency(page) {
  return page.evaluate(() => ({
    ms: window.audioState.lastStart - window.audioState.lastEventTime,
    taps: window.audioState.taps,
    voice: window.audioState.lastVoice,
  }));
}

test('pointerdown on a xylophone bar or a drum pad starts the sound in under 50 ms', async ({ page }, info) => {
  const errors = await openPlayground(page);
  const seen = [];
  for (const sel of ['#xk_2', '#xk_5', '#xk_7', '#drumPadBtn', '#drumSnareBtn', '#drumHihatBtn']) {
    const before = (await latency(page)).taps;
    await page.locator(sel).tap();
    const r = await latency(page);
    expect(r.taps, sel + ' sounded once').toBe(before + 1);
    expect(r.ms, sel + ' latency').toBeLessThan(BUDGET_MS);
    expect(r.ms).toBeGreaterThanOrEqual(0);
    seen.push({ sel, ms: Math.round(r.ms * 10) / 10, voice: r.voice });
  }
  const out = await page.evaluate(() => {
    const ac = window.getSharedAudioContext();
    return { baseLatency: ac.baseLatency, outputLatency: ac.outputLatency };
  });
  await info.attach('latency-' + info.project.name + '.json', {
    body: JSON.stringify({ taps: seen, audio: out }, null, 2), contentType: 'application/json',
  });
  expect(errors).toEqual([]);
});

test('the tapped bar gets the press/glow class', async ({ page }) => {
  await openPlayground(page);
  const bar = page.locator('#xk_3');
  const box = await bar.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(bar).toHaveClass(/mm-tap/);
  await page.mouse.up();
});

test('two fingers on two bars play two notes (multi-touch)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'raw multi-touch goes through the Chrome DevTools protocol');
  await openPlayground(page);
  // Neighbouring bars: on a phone the eight bars wrap into two rows.
  await page.locator('#xk_2').scrollIntoViewIfNeeded();
  const a = await page.locator('#xk_1').boundingBox();
  const b = await page.locator('#xk_2').boundingBox();
  const before = (await latency(page)).taps;
  const cdp = await page.context().newCDPSession(page);
  const pt = (box, id) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2, id });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(a, 1), pt(b, 2)] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await latency(page)).taps).toBe(before + 2);
});
