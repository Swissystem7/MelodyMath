// MM-732: a grade 1 child reaches the thickened length (mm-cur-9, ruler
// widget) and coin (mm-cur-11) topics from the programme page, gets the new
// items in the practice pool, sees the ruler drawn, and answers.
//
// Part of the shared suite (AGENTS.md: Playwright is never in package.json):
//   npx --yes playwright@1.49 test --config e2e/playwright.config.js e2e/grades1-3
// The items ship once banks.js appends grade-file late items (handoff in the
// stream B PR); until then this test skips itself and says why.
'use strict';
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context, baseURL }) => {
  // Deterministic and private: nothing leaves the local server.
  const host = new URL(baseURL).host;
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (/^https?:$/.test(u.protocol) && u.host !== host) return route.abort();
    return route.continue();
  });
});

const TOPICS = [
  { id: 'mm-cur-9', row: 'מדידת אורך (מתווך, ס״מ, סרגל)', first: 73201, ruler: true },
  { id: 'mm-cur-11', row: 'כסף — מטבעות וסכומים', first: 73207, ruler: false },
];

for (const t of TOPICS) {
  test(`[MM-732] grade 1 reaches and answers ${t.id} with the new items in the pool`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto('/program.html?grade=' + encodeURIComponent('א'));
    const ships = await page.evaluate((k) => allItems().some((it) => it.id === 'א-measurement-' + k), t.first);
    test.skip(!ships, 'MM-732 items wait for the banks.js late-items hook (stream B handoff)');

    const row = page.locator('li.topic', { has: page.locator('h3', { hasText: t.row }) });
    await expect(row).toHaveCount(1);
    const go = row.locator('a.go').first();
    await expect(go).toContainText('(12)');
    await go.click();

    await expect(page).toHaveURL(new RegExp('index\\.html\\?topic=' + t.id + '&skill=measurement$'));
    await expect(page.locator('#rmPlan')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    const pool = await page.evaluate(() => rmPlan[rpStep].items.map((it) => it.id));
    const fresh = Array.from({ length: 6 }, (_, i) => 'א-measurement-' + (t.first + i));
    expect(pool).toEqual(expect.arrayContaining(fresh));

    const it = await page.evaluate(() => {
      const c = rmPlan[rpStep].current;
      return { grade: c.grade, level: c.level, answer: c.answer, widget: c.widget || null, music: c.music, topicId: rmPlanTopic };
    });
    expect(it.grade).toBe('א');
    expect(it.level).toBe(1);
    expect(it.topicId).toBe(t.id);
    expect(it.music).toBeTruthy();
    if (t.ruler) {
      expect(it.widget).toBe('ruler');
      await expect(page.locator('#rmPlanWidget .ruler')).toBeVisible();
    }
    await expect(page.locator('#rmPlanWay')).not.toBeEmpty();

    const answer = page.locator('#rmPlanAnswer');
    await expect(answer).toBeEnabled();
    await answer.fill(String(it.answer));
    await page.locator('#rmPlanCheck').click();
    await expect(page.locator('#rmPlanFeedback')).toHaveClass(/\bgood\b/);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}
