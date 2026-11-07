// MM-714 — phone question layout (audit finding M5, docs/MM-700 in #951).
// After launch and after every answer, the prompt and the answer box are both
// inside the viewport; the mixtape and FamilyJam cards step aside during a run.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (/^https?:$/.test(u.protocol) && u.hostname !== '127.0.0.1') return route.abort();
    return route.continue();
  });
});

async function launch(page, grade) {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.click('#qsStartBtn');
  await page.click(`#qsGradePills button:has-text("${grade}")`);
  await page.click('#qsInstPills button >> nth=0');
  await page.click('#qsLaunchBtn');
  await expect(page.locator('#rmQuiz')).toBeVisible();
}

async function bothOnScreen(page) {
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const p = document.getElementById('rmPrompt').getBoundingClientRect();
    const a = document.getElementById('rmAnswer').getBoundingClientRect();
    return { pTop: p.top, aBottom: a.bottom, vh: innerHeight, focused: document.activeElement && document.activeElement.id };
  });
}

async function answer(page) {
  const before = await page.locator('#rmCounter').textContent();
  await page.fill('#rmAnswer', '7');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await page.locator('#rmNext').isVisible())
    || (await page.locator('#rmCounter').textContent()) !== before).toBe(true);
  if (await page.locator('#rmNext').isVisible()) await page.click('#rmNext');
}

for (const grade of ['א׳', 'ה׳']) {
  test(`grade ${grade}: prompt and answer box on screen after launch, 2nd and 4th item`, async ({ page }) => {
    await launch(page, grade);
    for (let item = 1; item <= 4; item++) {
      if (item === 1 || item === 2 || item === 4) {
        const r = await bothOnScreen(page);
        expect(r.pTop, `item ${item}: prompt top`).toBeGreaterThanOrEqual(0);
        expect(r.aBottom, `item ${item}: answer bottom`).toBeLessThanOrEqual(r.vh);
        expect(r.focused).toBe('rmAnswer');
      }
      if (item < 4) await answer(page);
    }
  });
}

test('mixtape and FamilyJam cards are hidden during a run and come back after it', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await expect(page.locator('#mixtapeCard')).toBeVisible();
  await page.click('#qsStartBtn');
  await page.click('#qsGradePills button:has-text("ב׳")');
  await page.click('#qsInstPills button >> nth=0');
  await page.click('#qsLaunchBtn');
  await expect(page.locator('#mixtapeCard')).toBeHidden();
  await page.click('#rmCancel');
  await expect(page.locator('#mixtapeCard')).toBeVisible();
});
