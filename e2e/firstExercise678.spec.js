// #678: the child plays within 10 seconds of opening a topic, and the
// diagnostic shows rounds of at most four questions.
const { test, expect } = require('@playwright/test');

test('topic open → first interactive exercise in under 10 s, in a round of ≤4', async ({ page }) => {
  const t0 = Date.now();
  await page.goto('index.html');
  await page.locator('#rmBegin').click();
  await expect(page.locator('#rmAnswer')).toBeEnabled();
  await expect(page.locator('#rmPrompt')).not.toBeEmpty();
  expect(Date.now() - t0).toBeLessThan(10000);
  await expect(page.locator('#rmCounter')).toContainText('סבב 1');
  await expect(page.locator('#rmCounter bdi')).toHaveText(/^[1-4]\/[1-4]$/);
});
