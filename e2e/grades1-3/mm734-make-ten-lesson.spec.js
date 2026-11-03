// MM-734: the grade א׳ guided lesson «השלמה לעשר» (mm-cur-3), added through
// the MMLessonRegistry contract, shows in the lessons tab under the grade א׳
// filter; a child steps through its 4 steps and passes the quiz.
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

test('[MM-734] grade 1 opens «השלמה לעשר», steps through and passes the check', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  await page.evaluate(() => document.getElementById('tab-lessons').click());
  await expect(page.locator('#lessons')).toBeVisible();
  await page.locator('#lessonsGradeFilter [data-lesson-filter="א"]').click();
  const card = page.locator('.lesson-card[data-lesson-id="g1-make-ten"]');
  await expect(card).toBeVisible();
  await expect(page.locator('.lesson-card')).toHaveCount(3);
  await card.locator('.lesson-start').click();

  await expect(page.locator('#activeLessonCard')).toBeVisible();
  await expect(page.locator('#activeLessonTitle')).toContainText('השלמה לעשר');
  for (let i = 1; i <= 3; i++) {
    await expect(page.locator('#stepCounterDisplay')).toContainText('שלב ' + i + ' מתוך 4');
    await page.locator('#stepNextBtn').click();
  }
  await expect(page.locator('#stepCounterDisplay')).toContainText('שלב 4 מתוך 4');
  await page.locator('.quiz-choice[data-choice-idx="0"]').click();
  await expect(page.locator('#lessonStepContent .feedback.good')).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
