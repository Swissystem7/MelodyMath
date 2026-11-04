// #955 stream B: the practice ruler and clock no longer print the value they
// show (it is the answer of a "read" item); revealWidget shows it after the
// child answers. The plan pool is steered to one old "read" item per widget.
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

for (const c of [
  { topic: 'mm-cur-9', id: 'א-measurement-324', read: '.ruler-read', before: '? ס״מ', after: '3 ס״מ', answer: '3' },
  { topic: 'mm-cur-10', id: 'א-measurement-328', read: '.clock-read', before: '?', after: '7:00', answer: '7' },
]) {
  test(`[#955] ${c.id}: the ${c.read} read-out waits until the child answers`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('/index.html?topic=' + c.topic + '&skill=measurement');
    await expect(page.locator('#rmPlan')).toBeVisible();
    const found = await page.evaluate((id) => {
      const st = rmPlan[rpStep];
      st.items = st.items.filter((it) => it.id === id); st.level = st.items[0] && st.items[0].level; st.history = [];
      rpRender();
      return st.items.length;
    }, c.id);
    expect(found).toBe(1);
    const read = page.locator('#rmPlanWidget ' + c.read);
    await expect(read).toHaveText(c.before);
    await page.locator('#rmPlanAnswer').fill(c.answer);
    await page.locator('#rmPlanCheck').click();
    await expect(page.locator('#rmPlanFeedback')).toHaveClass(/\bgood\b/);
    await expect(read).toHaveText(c.after);
    expect(errors).toEqual([]);
  });
}
