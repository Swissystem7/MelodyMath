// MM-735: «איך חשבת?» strategy items reach a grade 1 child in mm-cur-3 topic
// practice and the answer flow works. The pool is steered to the strategy
// items (the plan normally picks one of ~70 items at random), then the child
// types the answer and gets the "good" feedback.
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

test('[MM-735] grade 1 answers a «איך חשבת?» make-ten item in mm-cur-3 practice', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html?topic=mm-cur-3&skill=addition');
  await expect(page.locator('#rmPlan')).toBeVisible();
  const n = await page.evaluate(() => {
    const st = rmPlan[rpStep];
    const strategy = st.items.filter((it) => (it.tags || []).includes('strategy'));
    st.items = strategy; st.level = 1; st.history = []; st.lastId = null;
    rpRender();
    return strategy.length;
  });
  expect(n).toBe(5);
  await expect(page.locator('#rmPlanPrompt')).toContainText('איך חשבת');
  const it = await page.evaluate(() => {
    const c = rmPlan[rpStep].current;
    const src = rmPlan[rpStep].items.find((x) => c.id.indexOf(x.id) === 0);
    return { answer: c.answer, id: c.id, music: c.music, prompt: c.prompt, srcPrompt: src && src.prompt, srcAnswer: src && src.answer };
  });
  // Topic practice may wrap the id (…-var-rN) but keeps the strategy prompt and answer as written.
  expect(it.id).toMatch(/^א-addition-735\d\d/);
  expect(it.prompt).toBe(it.srcPrompt);
  expect(it.answer).toBe(it.srcAnswer);
  expect(it.music).toBeTruthy();
  await page.locator('#rmPlanAnswer').fill(String(it.answer));
  await page.locator('#rmPlanCheck').click();
  await expect(page.locator('#rmPlanFeedback')).toHaveClass(/\bgood\b/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
