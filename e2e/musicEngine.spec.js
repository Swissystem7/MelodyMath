// MelodyMath — the shared music engine in a real browser (plan §3, §4).
//
// What Node cannot answer: does the AudioContext really reach 'running' after
// the first tap on an iPhone, is there exactly one context, does the page open
// with the network off, and do the tap targets measure up at 360px.
// See e2e/playwright.config.js for how to run this.
const { test, expect } = require('@playwright/test');

const MIN_TARGET = 44;
const MIN_GAP = 8;

// Console errors are a failure in their own right (plan §4.6).
function watchConsole(page) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

async function openHome(page) {
  const errors = watchConsole(page);
  await page.goto('/index.html');
  await expect(page.locator('#main')).toBeVisible();
  await page.waitForFunction(() => typeof window.getSharedAudioContext === 'function');
  return errors;
}

const tap = (page) => page.locator('#main').click({ position: { x: 5, y: 5 } });

test('home fits the viewport, stays RTL and keeps math isolated LTR', async ({ page }, info) => {
  const errors = await openHome(page);
  const page_ = await page.evaluate(() => {
    // Probe the live stylesheet rather than whichever prompt is on screen:
    // .math-ltr is what mathBidi.js wraps every expression in (#93).
    const el = document.createElement('span');
    el.className = 'math-ltr';
    document.getElementById('main').appendChild(el);
    const s = getComputedStyle(el);
    const out = {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      dir: document.documentElement.dir,
      direction: s.direction,
      bidi: s.unicodeBidi,
    };
    el.remove();
    return out;
  });
  expect(page_.scrollWidth).toBeLessThanOrEqual(page_.innerWidth);
  expect(page_.dir).toBe('rtl');
  expect(page_.direction).toBe('ltr');
  expect(page_.bidi).toMatch(/isolate/);
  await info.attach('home-' + info.project.name + '.png', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  expect(errors).toEqual([]);
});

test('every visible target is at least 44x44 with 8px between neighbours', async ({ page }) => {
  await openHome(page);
  const boxes = [];
  for (const el of await page.locator('#main button:visible, #main a[href]:visible, #main select:visible').all()) {
    const box = await el.boundingBox();
    if (!box) continue;
    const label = ((await el.textContent()) || (await el.getAttribute('id')) || '?').trim().slice(0, 30);
    expect(Math.round(box.width), 'width of ' + label).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(Math.round(box.height), 'height of ' + label).toBeGreaterThanOrEqual(MIN_TARGET);
    boxes.push({ label, box });
  }
  expect(boxes.length, 'expected visible targets on the home panel').toBeGreaterThan(0);
  // Two targets may sit close on one axis as long as they are clear on the
  // other; too close on both means a thumb cannot tell them apart.
  boxes.forEach(({ label, box: a }, i) => boxes.slice(i + 1).forEach(({ label: other, box: b }) => {
    const gapX = Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width));
    const gapY = Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height));
    expect(Math.max(gapX, gapY), label + ' and ' + other + ' are too close').toBeGreaterThanOrEqual(MIN_GAP);
  }));
});

test('nothing sounds before a gesture; the first tap unlocks the one shared context', async ({ page }) => {
  const errors = await openHome(page);
  // 'idle' means no AudioContext has even been built, so nothing can have
  // played yet — the iOS Safari rule and plan §4.3.
  expect(await page.evaluate(() => window.audioState())).toBe('idle');

  await tap(page);

  await expect.poll(() => page.evaluate(() => window.audioState()),
    { message: 'AudioContext.state after the first tap', timeout: 5000 }).toBe('running');
  expect(await page.evaluate(() => window.getSharedAudioContext().state)).toBe('running');
  // sonify.js borrows the same context instead of opening a second one.
  expect(await page.evaluate(() => window.getAudioContext() === window.getSharedAudioContext())).toBe(true);
  expect(errors).toEqual([]);
});

test('a sequence is timed off the audio clock and clamped to the safe band', async ({ page }) => {
  await openHome(page);
  await tap(page);
  await expect.poll(() => page.evaluate(() => window.audioState())).toBe('running');

  const played = await page.evaluate(() => {
    const before = window.getSharedAudioContext().currentTime;
    const notes = window.scheduleSequence(
      [{ fraction: 'quarter', hz: 220 }, { fraction: 'eighth', hz: 5000 }, { fraction: 'eighth', hz: 20 }],
      { bpm: 120 }
    );
    return { before, notes, canReplay: window.canReplay() };
  });
  expect(played.notes.map((n) => n.hz)).toEqual([220, 1760, 110]);
  played.notes.forEach((n) => {
    expect(n.gain).toBeLessThanOrEqual(0.3);
    expect(n.time).toBeGreaterThan(played.before);
  });
  // 120 bpm: a quarter lasts 0.5s, so the eighth after it starts 0.5s later.
  expect(played.notes[1].time - played.notes[0].time).toBeCloseTo(0.5, 5);
  expect(played.canReplay).toBe(true);
  expect(await page.evaluate(() => window.replaySequence().length)).toBe(3);
});

test('after one visit the page and the engine work with the network off', async ({ page, context }) => {
  await openHome(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => caches.keys()
    .then((ks) => Promise.all(ks.map((k) => caches.open(k).then((c) => c.match('./src/lib/musicEngine.js')))))
    .then((hits) => hits.some(Boolean))),
  { message: 'musicEngine.js in the service-worker cache', timeout: 10000 }).toBe(true);

  await context.setOffline(true);
  const errors = watchConsole(page);
  await page.reload();
  await expect(page.locator('#main')).toBeVisible();
  expect(await page.evaluate(() => window.measureFill('4/4', ['1/4', '1/8', '1/8', '1/2']).fill)).toBe('full');
  await context.setOffline(false);
  expect(errors).toEqual([]);
});
