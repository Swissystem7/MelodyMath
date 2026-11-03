// MM-100 area: guided lessons, the rhythm clock, QR export.
// Report only. Nobody fixes these until Antigravity finishes MM-100 and
// Aviran lifts the freeze. MM-100 itself may flip them; then remove test.fail().
'use strict';
const { test, expect } = require('./_fixtures');

test('[m4][MM-100] QR export with no student selected says so instead of building a code', async ({ page }) => {
  test.fail(true, 'm4 open (MM-100 area): a QR is built for the placeholder "תלמיד"');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.click('#qrShareBtn');
  await page.click('#qrModeExport');
  await page.click('#qrExportStudentBtn');
  await expect(page.locator('#qrExportSvgBox svg')).toHaveCount(0);
});

test('[M9][MM-100] the guided lesson "practice" button opens practice on the lesson topic', async ({ page }) => {
  test.fail(true, 'M9 open (MM-100 area): the button returns to the generic home screen');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.click('#tab-lessons');
  await page.click('#lessonsGrid button >> nth=0');
  for (let i = 0; i < 6 && !(await page.locator('#stepPracticeBtn').isVisible()); i++) {
    await page.locator('#stepNextBtn').click({ timeout: 5000 });
    await page.waitForTimeout(300);
  }
  // Practice stays disabled until the check question is answered correctly: try each choice.
  const choices = page.locator('#stepQuizChoices button');
  for (let i = 0; i < await choices.count() && !(await page.locator('#stepPracticeBtn').isEnabled()); i++) {
    if (await choices.nth(i).isEnabled()) { await choices.nth(i).click(); await page.waitForTimeout(250); }
  }
  await page.locator('#stepPracticeBtn').click({ timeout: 5000 });
  await page.waitForTimeout(600);
  await expect(page.locator('#rmPlan')).toBeVisible({ timeout: 3000 });
});

test('[M10][MM-100] the lessons library holds the 38 MM-100 lessons', async ({ page }) => {
  test.fail(true, 'M10 open (MM-100 area): 10 lessons on master');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => getAllLessons().length)).toBeGreaterThanOrEqual(38);
});

test('[M11][MM-100] the rhythm clock card is inside <main>, not after the footer', async ({ page }) => {
  test.fail(true, 'M11 open (MM-100 area, clock): #rpCard is a child of <body> after <footer>');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => !!document.querySelector('main #rpCard'))).toBe(true);
});
