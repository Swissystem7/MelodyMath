// MM-711 — child-first home (audit finding B1, docs/MM-700 in #951).
// The child's start button "מתחילים עכשיו" is on the first screen of a fresh
// device, at 360x640 and 1280x800; the adult blocks are folded into one
// collapsed "למבוגרים" section and every feature in it is still reachable.
// Every request to another host is aborted, so nothing leaves the machine.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (/^https?:$/.test(u.protocol) && u.hostname !== '127.0.0.1') return route.abort();
    return route.continue();
  });
});

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/net::ERR_FAILED|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text());
  });
  return errors;
}

test('fresh device: the start button is inside the first viewport, no scrolling', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  const m = await page.evaluate(() => {
    const r = document.getElementById('qsStartBtn').getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, vh: innerHeight, vw: innerWidth, y: scrollY };
  });
  expect(m.y).toBe(0);
  expect(m.top).toBeGreaterThanOrEqual(0);
  expect(m.bottom).toBeLessThanOrEqual(m.vh);
  expect(m.left).toBeGreaterThanOrEqual(0);
  expect(m.right).toBeLessThanOrEqual(m.vw);
  await expect(page.locator('#qsStartBtn')).toBeVisible();
  await expect(page.locator('#qsStartBtn')).toHaveText(/מתחילים עכשיו/);
  // The start card comes before every adult block in the page.
  const order = await page.evaluate(() => {
    const hero = document.getElementById('welcomeHero');
    return ['adultArea', 'whoBar', 'firstRun', 'gradeBar', 'metroBar'].every((id) =>
      hero.compareDocumentPosition(document.getElementById(id)) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(order).toBe(true);
});

test('starting a session from the first screen works', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.click('#qsStartBtn');
  await page.click('#qsGradePills button:has-text("ב׳")');
  await page.click('#qsInstPills button >> nth=0');
  await page.click('#qsLaunchBtn');
  await expect(page.locator('#rmQuiz')).toBeVisible();
  await expect(page.locator('#welcomeHero')).toBeHidden();
  await expect(page.locator('#rmPrompt')).not.toHaveText('');
  const counter = await page.locator('#rmCounter').textContent();
  expect(counter).toBeTruthy();
  await page.fill('#rmAnswer', '7');
  await page.keyboard.press('Enter');
  // The diagnostic either shows feedback or moves on to the next item.
  await expect.poll(async () => (await page.locator('#rmFeedback').isVisible())
    || (await page.locator('#rmCounter').textContent()) !== counter).toBe(true);
  // Cancelling the run brings the start card back.
  await page.click('#rmCancel');
  await expect(page.locator('#welcomeHero')).toBeVisible();
  expect(errors).toEqual([]);
});

test('adult blocks are folded into one collapsed section and stay reachable', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  const area = page.locator('details#adultArea');
  await expect(area).toHaveCount(1);
  expect(await area.evaluate((d) => d.open)).toBe(false);
  for (const id of ['whoBar', 'firstRun', 'gradeBar', 'metroBar', 'qrShareBtn', 'smartboardToggle']) {
    expect(await page.locator('#adultArea #' + id).count(), id).toBe(1);
  }
  expect(await page.locator('#adultArea nav.more-nav a.navcard').count()).toBe(5);
  // A fresh device renders the first-run teacher guide inside the section.
  expect(await page.locator('#adultArea #firstRun:not(.hidden) #firstRunInner').count()).toBe(1);
  await expect(page.locator('#studentName')).toBeHidden();
  await area.locator(':scope > summary').click();
  await expect(page.locator('#studentName')).toBeVisible();
  await expect(page.locator('#gradePick button').first()).toBeVisible();
  await expect(page.locator('#firstRunInner')).toBeVisible();
  // The QR modal lives outside the section, so it opens.
  await page.click('#qrShareBtn');
  await expect(page.locator('#qrModal')).toBeVisible();
});

test('the start card belongs to the practice tab; other tabs and the teacher gate still work', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.click('#tab-lessons');
  await expect(page.locator('#lessons')).toBeVisible();
  await expect(page.locator('#welcomeHero')).toBeHidden();
  await page.click('#tab-teacherReport');
  await expect(page.locator('#adultGate')).toBeVisible();
  await page.click('#adultGateCancel');
  await page.click('#tab-remediation');
  await expect(page.locator('#welcomeHero')).toBeVisible();
});

test('class mode without a name opens the adult section and focuses the name box', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.click('#tab-classMode');
  await page.click('#classStart');
  await expect(page.locator('#classGateMsg')).toBeVisible();
  expect(await page.locator('#adultArea').evaluate((d) => d.open)).toBe(true);
  await expect(page.locator('#studentName')).toBeFocused();
});
