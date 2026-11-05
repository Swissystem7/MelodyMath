// MM-717 — local roles + picture PIN (audit finding B3, local half).
// Role choice on the home screen, kept across reload; teacher/parent wait for
// the adult gate; a wrong picture PIN cannot open another child's row.
// Fake local names only. Every request to another host is aborted.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (/^https?:$/.test(u.protocol) && u.hostname !== '127.0.0.1') return route.abort();
    return route.continue();
  });
});

const current = (page) => page.evaluate(() => window.MMAccount.current());

async function passGate(page) {
  await expect(page.locator('#adultGate')).toBeVisible();
  const [a, b] = (await page.locator('#adultGateQ').textContent()).match(/\d+/g).map(Number);
  await page.fill('#adultGateAnswer', String(a * b));
  await page.locator('#adultGateOk').click({ delay: 3200 });
}

async function saveKid(page, code, name) {
  await page.fill('#classCode', code);
  await page.fill('#studentName', name);
  await page.click('#whoSave');
}

test('the home screen offers student, teacher and parent; the choice survives reload', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  for (const t of ['אני תלמיד/ה', 'אני מורה', 'אני הורה']) await expect(page.locator('#roleBar button', { hasText: t })).toBeVisible();
  expect(await current(page)).toBeNull();
  await page.click('#roleBar [data-role="student"]');
  expect((await current(page)).role).toBe('student');
  await expect(page.locator('#roleBar [data-role="student"]')).toHaveAttribute('aria-pressed', 'true');
  await page.reload({ waitUntil: 'networkidle' });
  expect((await current(page)).role).toBe('student');
  await expect(page.locator('#roleNow')).toContainText('תלמיד/ה');
  // The start button is still on the first screen.
  const bottom = await page.evaluate(() => document.getElementById('qsStartBtn').getBoundingClientRect().bottom);
  expect(bottom).toBeLessThanOrEqual(page.viewportSize().height);
});

test('teacher role is stored only after the adult gate; cancelling keeps the old role', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.click('#roleBar [data-role="teacher"]');
  await expect(page.locator('#adultGate')).toBeVisible();
  await page.click('#adultGateCancel');
  expect(await current(page)).toBeNull();
  await page.click('#roleBar [data-role="teacher"]');
  await passGate(page);
  await expect(page.locator('#teacherReport')).toBeVisible();
  expect((await current(page)).role).toBe('teacher');
  // The teacher tab itself is still gated after leaving it.
  await page.click('#tab-remediation');
  await page.click('#tab-teacherReport');
  await expect(page.locator('#adultGate')).toBeVisible();
});

test('onChange reports a student switch with the contract shape', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => { window.__seen = []; window.MMAccount.onChange((c) => window.__seen.push(c)); });
  await page.click('#roleBar [data-role="student"]');
  await saveKid(page, 'E2E-717', 'kid-a');
  const seen = await page.evaluate(() => window.__seen);
  expect(seen.at(-1)).toEqual({ id: 'student:E2E-717:kid-a', name: 'kid-a', role: 'student', classCode: 'E2E-717' });
});

test('a wrong picture PIN cannot open another child; the right one can', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await saveKid(page, 'E2E-717', 'kid-b');
  await saveKid(page, 'E2E-717', 'kid-a');
  // Teacher gives kid-b a PIN from the gated tab.
  await page.click('#tab-teacherReport');
  await passGate(page);
  await saveKid(page, 'E2E-717', 'kid-b');
  await page.click('#pinSetBtn');
  for (const p of ['🐶', '🐱', '🦊', '🐸']) await page.click(`#pinPad [data-pin="${p}"]`);
  await expect(page.locator('#pinModal')).toBeHidden();
  await expect(page.locator('#pinCardMsg')).toContainText('kid-b');
  await saveKid(page, 'E2E-717', 'kid-a');
  await page.click('#tab-remediation');
  await page.click('#roleBar [data-role="student"]');
  // A child on kid-a tries to switch to kid-b.
  await page.click('#rosterChips button[data-kid="kid-b"]');
  await expect(page.locator('#pinModal')).toBeVisible();
  for (const p of ['🐱', '🐶', '🦊', '🐸']) await page.click(`#pinPad [data-pin="${p}"]`);
  await expect(page.locator('#pinMsg')).toContainText('לא נכון');
  await page.click('#pinCancel');
  expect((await current(page)).name).toBe('kid-a');
  await expect(page.locator('#studentName')).toHaveValue('kid-a');
  // The right pictures switch.
  await page.click('#rosterChips button[data-kid="kid-b"]');
  for (const p of ['🐶', '🐱', '🦊', '🐸']) await page.click(`#pinPad [data-pin="${p}"]`);
  await expect(page.locator('#pinModal')).toBeHidden();
  expect((await current(page)).name).toBe('kid-b');
});
