// MM-738: a grade 3 child gets a drawn minute clock in hours-and-minutes
// practice (mm-cur-28): the minute hand points at the item's minutes, the
// read-out waits until the child answers, and the answer flow works. The plan
// pool is steered to the new minute-clock items.
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

test('[MM-738] grade 3 reads a drawn minute clock and answers', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html?topic=mm-cur-28&skill=measurement');
  await expect(page.locator('#rmPlan')).toBeVisible();
  const n = await page.evaluate(() => {
    const st = rmPlan[rpStep];
    st.items = st.items.filter((it) => it.clock && it.clock.minutes > 0);
    st.level = 1; st.history = []; st.lastId = null;
    rpRender();
    return st.items.length;
  });
  expect(n).toBe(8);
  const it = await page.evaluate(() => {
    const c = rmPlan[rpStep].current;
    const src = rmPlan[rpStep].items.find((x) => c.id.indexOf(x.id) === 0);
    return { grade: c.grade, answer: c.answer, clock: c.clock, prompt: c.prompt, srcPrompt: src && src.prompt };
  });
  expect(it.grade).toBe('ג');
  expect(it.prompt).toBe(it.srcPrompt);
  await expect(page.locator('#rmPlanWidget .clock-min')).toHaveAttribute('style', 'transform:rotate(' + it.clock.minutes * 6 + 'deg)');
  await expect(page.locator('#rmPlanWidget .clock-hour')).toHaveAttribute('style', 'transform:rotate(' + ((it.clock.hour % 12) * 30 + it.clock.minutes / 2) + 'deg)');
  await expect(page.locator('#rmPlanWidget .clock-read')).toHaveText('?');
  await page.locator('#rmPlanAnswer').fill(String(it.answer));
  await page.locator('#rmPlanCheck').click();
  await expect(page.locator('#rmPlanFeedback')).toHaveClass(/\bgood\b/);
  await expect(page.locator('#rmPlanWidget .clock-read')).toHaveText(it.clock.hour + ':' + String(it.clock.minutes).padStart(2, '0'));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
