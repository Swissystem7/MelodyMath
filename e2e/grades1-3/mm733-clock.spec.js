// MM-733: a grade 1 child opens the whole-hour clock topic (mm-cur-10) from the
// programme page, the new items are in the pool, the clock face is drawn with
// the hour hand at the item's hour, and the child answers.
//
// Part of the shared suite (AGENTS.md: Playwright is never in package.json):
//   npx --yes playwright@1.49 test --config e2e/playwright.config.js e2e/grades1-3
'use strict';
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context, baseURL }) => {
  const host = new URL(baseURL).host;
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (/^https?:$/.test(u.protocol) && u.host !== host) return route.abort();
    return route.continue();
  });
});

test('[MM-733] grade 1 reads the drawn clock and answers a whole-hour item', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/program.html?grade=' + encodeURIComponent('א'));
  const row = page.locator('li.topic', { has: page.locator('h3', { hasText: 'שעון' }) });
  await expect(row).toHaveCount(1);
  await expect(row.locator('a.go').first()).toContainText('(12)');
  await row.locator('a.go').first().click();

  await expect(page).toHaveURL(/index\.html\?topic=mm-cur-10&skill=measurement$/);
  await expect(page.locator('#rmPlan')).toBeVisible();
  const pool = await page.evaluate(() => rmPlan[rpStep].items.map((it) => it.id));
  expect(pool).toEqual(expect.arrayContaining(['א-measurement-73301', 'א-measurement-73302']));

  const it = await page.evaluate(() => {
    const c = rmPlan[rpStep].current;
    return { level: c.level, answer: c.answer, widget: c.widget, hour: c.clock && c.clock.hour, topic: rmPlanTopic };
  });
  expect(it.topic).toBe('mm-cur-10');
  expect(it.level).toBe(1);
  expect(it.widget).toBe('clock');
  const hand = page.locator('#rmPlanWidget .clock-hour');
  await expect(hand).toBeVisible();
  await expect(hand).toHaveAttribute('style', 'transform:rotate(' + (it.hour % 12) * 30 + 'deg)');

  await page.locator('#rmPlanAnswer').fill(String(it.answer));
  await page.locator('#rmPlanCheck').click();
  await expect(page.locator('#rmPlanFeedback')).toHaveClass(/\bgood\b/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
