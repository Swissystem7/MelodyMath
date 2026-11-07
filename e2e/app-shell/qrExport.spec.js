// Stream D handoff (#953) and audit m4 — the QR export window in index.html.
// No student picked: a notice, no code for the placeholder "תלמיד". A picked
// student: a code. With #953's qrFits(), text too long for one QR gets a
// notice instead of a broken image (checked here with a stubbed qrFits).
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (/^https?:$/.test(u.protocol) && u.hostname !== '127.0.0.1') return route.abort();
    return route.continue();
  });
});

async function openExport(page) {
  await page.click('#qrShareBtn');
  await page.click('#qrModeExport');
}

test('no student picked: a notice, and no QR is built', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await openExport(page);
  await page.click('#qrExportStudentBtn');
  await expect(page.locator('#qrExportSvgBox svg')).toHaveCount(0);
  await expect(page.locator('#qrExportMsg')).toContainText('עוד לא נבחר/ה תלמיד/ה');
});

test('a picked student gets a code; a code that does not fit gets a notice', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.fill('#classCode', 'E2E-QR');
  await page.fill('#studentName', 'kid-q');
  await page.click('#whoSave');
  await openExport(page);
  await page.click('#qrExportStudentBtn');
  await expect(page.locator('#qrExportSvgBox svg')).toHaveCount(1);
  await expect(page.locator('#qrExportMsg')).toContainText('kid-q');
  await page.evaluate(() => { window.qrFits = () => false; });
  await page.click('#qrExportStudentBtn');
  await expect(page.locator('#qrExportSvgBox svg')).toHaveCount(0);
  await expect(page.locator('#qrExportMsg')).toContainText('ארוכים מדי');
});
