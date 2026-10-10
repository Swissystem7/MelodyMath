'use strict';
/**
 * Plan §4 mobile checks — invoked from test/mobile-layout.test.js after
 * test/e2e dependencies are installed.
 */

const TAB_IDS = ['remediation', 'practice', 'playground', 'classMode', 'beatMode', 'teacherReport'];

const fixedViewports = [
  { label: 'tablet-820', width: 820, height: 1180 },
  { label: 'phone-390', width: 390, height: 844 },
  { label: 'phone-360', width: 360, height: 740 },
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

async function assertNoHorizontalScroll(page) {
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  assert(sizes.scrollWidth <= sizes.innerWidth + 1, 'horizontal scroll at ' + sizes.scrollWidth + ' > ' + sizes.innerWidth);
}

async function assertVisibleButtonTargets(page) {
  const boxes = await page.locator('button:visible').evaluateAll((nodes) =>
    nodes.map((el) => {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height };
    }),
  );
  boxes.forEach((box, i) => {
    assert(box.h >= 44, 'button ' + i + ' height ' + box.h);
    assert(box.w >= 44, 'button ' + i + ' width ' + box.w);
  });
}

async function exerciseMainTabs(page) {
  for (const tab of TAB_IDS) {
    await page.locator('[data-tab="' + tab + '"]').click();
    await page.waitForTimeout(80);
    await assertNoHorizontalScroll(page);
    await assertVisibleButtonTargets(page);
  }
}

async function runViewportSuite(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('http://127.0.0.1:8765/index.html');
  await page.locator('#main').waitFor();
  await exerciseMainTabs(page);
  await page.locator('body').click({ position: { x: 12, y: 12 } });
  const audioState = await page.evaluate(() => {
    if (typeof getSharedAudioContext !== 'function') return 'missing';
    const ac = getSharedAudioContext();
    return ac ? ac.state : 'none';
  });
  assert(audioState === 'running' || audioState === 'suspended', 'audio context after gesture: ' + audioState);
  assert(errors.length === 0, 'console errors: ' + errors.join('; '));
  await context.close();
}

async function runDeviceSuite(browser, devices, name) {
  const context = await browser.newContext({ ...devices[name] });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8765/index.html');
  await exerciseMainTabs(page);
  await assertNoHorizontalScroll(page);
  await context.close();
}

async function runOfflineSuite(browser, devices) {
  const context = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8765/index.html');
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#main h1').waitFor({ state: 'visible' });
  await context.close();
}

async function runMobileE2E(playwright) {
  const { chromium, devices } = playwright;
  const browser = await chromium.launch();
  try {
    for (const vp of fixedViewports) {
      await runViewportSuite(browser, { width: vp.width, height: vp.height });
    }
    await runDeviceSuite(browser, devices, 'iPhone 13');
    await runDeviceSuite(browser, devices, 'Pixel 7');
    await runOfflineSuite(browser, devices);
  } finally {
    await browser.close();
  }
}

module.exports = { runMobileE2E, fixedViewports };
