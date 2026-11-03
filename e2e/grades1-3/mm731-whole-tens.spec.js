// MM-731: a grade 1 child reaches a whole-tens item (mm-cur-4) at the basis
// level and answers it. Route: the programme page for grade א׳ → the whole-tens
// row → «תרגול: חיבור» → index.html?topic=mm-cur-4&skill=addition, which opens
// at level 1. Before MM-731 the row had challenge items only.
//
// Part of the shared suite (AGENTS.md: Playwright is never in package.json):
//   npx --yes playwright@1.49 test --config e2e/playwright.config.js e2e/grades1-3
'use strict';
const { test, expect } = require('@playwright/test');

const ROW = 'חיבור וחיסור בעשרות שלמות עד 100';

test.beforeEach(async ({ context, baseURL }) => {
  // Deterministic and private: nothing leaves the local server.
  const host = new URL(baseURL).host;
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (/^https?:$/.test(u.protocol) && u.host !== host) return route.abort();
    return route.continue();
  });
});

test('[MM-731] grade 1 reaches and answers a basis whole-tens item', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('/program.html?grade=' + encodeURIComponent('א'));
  const row = page.locator('li.topic', { has: page.locator('h3', { hasText: ROW }) });
  await expect(row).toHaveCount(1);
  const go = row.locator('a.go', { hasText: 'חיבור' });
  await expect(go).toHaveAttribute('href', /topic=mm-cur-4&skill=addition$/);
  await go.click();

  await expect(page).toHaveURL(/index\.html\?topic=mm-cur-4&skill=addition$/);
  await expect(page.locator('#rmPlan')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#rmPlanSkill')).toContainText('בסיס');
  await expect(page.locator('#rmPlanPrompt')).not.toBeEmpty();

  const it = await page.evaluate(() => {
    const c = rmPlan[rpStep].current;
    return { level: c.level, standard: c.standard, grade: c.grade, answer: c.answer, music: c.music, topicId: c.topicId };
  });
  expect(it.grade).toBe('א');
  expect(it.level).toBe(1);
  expect(it.topicId).toBe('mm-cur-4');
  expect(it.standard).toBe('חיבור וחיסור בעשרות שלמות עד 100');
  expect(it.music).toBeTruthy();
  expect(it.answer % 10).toBe(0);
  // The music way of the item is on screen next to the question.
  await expect(page.locator('#rmPlanWay')).toBeVisible();
  await expect(page.locator('#rmPlanWay')).not.toBeEmpty();

  const answer = page.locator('#rmPlanAnswer');
  await expect(answer).toBeEnabled();
  await answer.fill(String(it.answer));
  await page.locator('#rmPlanCheck').click();
  await expect(page.locator('#rmPlanFeedback')).toBeVisible();
  await expect(page.locator('#rmPlanFeedback')).toHaveClass(/\bgood\b/);
  await expect(page.locator('#rmPlanNext')).toBeVisible();

  // Fits the phone: no sideways scroll.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
