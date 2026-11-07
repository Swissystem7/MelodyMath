// MM-716 — resume after reload (audit finding M2).
// An interrupted diagnostic comes back at the same question after a reload,
// also offline; "start over" and cancel forget it; the gap report survives a
// reload. Every request to another host is aborted.
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

async function answer(page, n) {
  for (let i = 0; i < n; i++) {
    const before = (await page.locator('#rmCounter').textContent()) + '|' + (await page.locator('#rmPrompt').textContent());
    await page.fill('#rmAnswer', '7');
    await page.keyboard.press('Enter');
    // Enter either shows "next" or moves on by itself.
    await expect.poll(async () => (await page.locator('#rmNext').isVisible()) || !(await page.locator('#rmQuiz').isVisible())
      || ((await page.locator('#rmCounter').textContent()) + '|' + (await page.locator('#rmPrompt').textContent())) !== before).toBe(true);
    if (await page.locator('#rmNext').isVisible()) await page.click('#rmNext');
  }
}

test('an interrupted diagnostic resumes at the same question after reload', async ({ page }) => {
  await launch(page, 'ב׳');
  await answer(page, 3);
  const prompt = await page.locator('#rmPrompt').textContent();
  const counter = await page.locator('#rmCounter').textContent();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#rmQuiz')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('#rmPrompt')).toHaveText(prompt);
  await expect(page.locator('#rmCounter')).toHaveText(counter);
  await expect(page.locator('#rmResumeNote')).toBeVisible();
  await expect(page.locator('#welcomeHero')).toBeHidden();
});

test('"start over" forgets the run; the next reload shows the home screen', async ({ page }) => {
  await launch(page, 'ב׳');
  await answer(page, 2);
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('#rmResumeRestart');
  await expect(page.locator('#rmStart')).toBeVisible();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#rmQuiz')).toBeHidden();
  await expect(page.locator('#qsStartBtn')).toBeVisible();
});

test('an offline reload also resumes (service worker cache)', async ({ page, context }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('#qsStartBtn');
  await page.click('#qsGradePills button:has-text("ג׳")');
  await page.click('#qsInstPills button >> nth=0');
  await page.click('#qsLaunchBtn');
  await answer(page, 2);
  const prompt = await page.locator('#rmPrompt').textContent();
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('#rmQuiz')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#rmPrompt')).toHaveText(prompt);
  } finally {
    await context.setOffline(false);
  }
});

test('the gap report survives a reload', async ({ page }) => {
  await launch(page, 'ה׳');
  for (let i = 0; i < 40 && await page.locator('#rmQuiz').isVisible(); i++) await answer(page, 1);
  await expect(page.locator('#rmReport')).toBeVisible();
  const stats = await page.locator('#rmStats').textContent();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#rmReport')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('#rmStats')).toHaveText(stats);
});
