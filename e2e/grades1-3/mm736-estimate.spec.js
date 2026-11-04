// MM-736: «בערך כמה?» estimation in grade 1 (mm-cur-1): a value inside the
// item's range (not the exact count) is accepted, one outside is not. The
// plan pool is steered to the estimation items.
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

async function openEstimate(page) {
  await page.goto('/index.html?topic=mm-cur-1&skill=counting');
  await expect(page.locator('#rmPlan')).toBeVisible();
  const n = await page.evaluate(() => {
    const st = rmPlan[rpStep];
    st.items = st.items.filter((it) => (it.tags || []).includes('estimate'));
    st.level = 1; st.history = []; st.lastId = null;
    rpRender();
    return st.items.length;
  });
  expect(n).toBe(6);
  await expect(page.locator('#rmPlanPrompt')).toContainText('בערך כמה');
  return page.evaluate(() => {
    const c = rmPlan[rpStep].current;
    return { answer: c.answer, tolerance: c.tolerance };
  });
}

test('[MM-736] a grade 1 estimate inside the range is accepted', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const it = await openEstimate(page);
  expect(it.tolerance).toBeGreaterThan(0);
  await page.locator('#rmPlanAnswer').fill(String(it.answer + it.tolerance - 1));
  await page.locator('#rmPlanCheck').click();
  await expect(page.locator('#rmPlanFeedback')).toHaveClass(/\bgood\b/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('[MM-736] an estimate outside the range is not accepted', async ({ page }) => {
  const it = await openEstimate(page);
  await page.locator('#rmPlanAnswer').fill(String(it.answer + it.tolerance + 5));
  await page.locator('#rmPlanCheck').click();
  await expect(page.locator('#rmPlanFeedback')).toHaveClass(/\bbad\b/);
});
