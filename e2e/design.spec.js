// #427 — axe, 44px targets, RTL and the first screen at 360px and 1366px, and
// the pace meter's three states for a weak, a medium and a strong student.
// Run with e2e/design.config.js (see the command there).
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

// axe-core comes from `npx -p axe-core`, which puts its .bin on PATH but not on
// the require path of this file. MM_AXE may point at axe.min.js directly.
function axeSource() {
  const candidates = [process.env.MM_AXE];
  try { candidates.push(require.resolve('axe-core/axe.min.js')); } catch (e) { /* not local */ }
  for (const dir of String(process.env.PATH || '').split(path.delimiter)) {
    if (/node_modules[\\/]\.bin$/.test(dir)) candidates.push(path.join(dir, '..', 'axe-core', 'axe.min.js'));
  }
  const found = candidates.find((p) => p && fs.existsSync(p));
  if (!found) throw new Error('axe-core not found: run through `npx -p axe-core@4.10` or set MM_AXE');
  return fs.readFileSync(found, 'utf8');
}
const AXE = axeSource();

async function axeSerious(page, include) {
  await page.addScriptTag({ content: AXE });
  const result = await page.evaluate((sel) => window.axe.run(sel ? { include: [sel] } : document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  }), include || null);
  return result.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id + ' (' + v.impact + '): ' + v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | '));
}

// Visible controls under 44×44 CSS px, inside the active panel and its chrome.
async function smallTargets(page, scope) {
  return page.evaluate((sel) => {
    const out = [];
    document.querySelectorAll(sel + ' :is(button, select, summary, input:not([type=hidden]), [role=tab])').forEach((el) => {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      if (!r.width || !r.height || st.visibility === 'hidden' || el.closest('[hidden], .hidden')) return;
      if (el.type === 'checkbox' || el.type === 'radio') return; // the label is the target
      if (r.width < 44 || r.height < 44) out.push((el.id || el.textContent.trim().slice(0, 24)) + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
    });
    return out;
  }, scope);
}

async function shot(page, testInfo, name) {
  const tag = process.env.MM_SHOT;
  if (!tag) return;
  const dir = path.join(__dirname, '..', 'docs', 'screenshots', process.env.MM_PR || '427');
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, tag + '-' + name + '-' + testInfo.project.name + '.png'), fullPage: false });
}

async function open(page, seed) {
  await page.addInitScript((s) => {
    if (s.keepOnboard) localStorage.removeItem('mm-onboard-v1');
    else localStorage.setItem('mm-onboard-v1', JSON.stringify({ dismissed: true, step: 0 }));
    localStorage.setItem('mm-grade', 'א');
    if (!s.kid) return;
    localStorage.setItem('mm-who-v1', JSON.stringify({ classCode: 'דמו', name: s.kid.name }));
    localStorage.setItem('mm-roster-v1:דמו', JSON.stringify({ classCode: 'דמו', students: { [s.kid.name]: s.kid } }));
  }, seed || {});
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto('/index.html');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  return errors;
}

test('first screen: at most 3 choices, RTL, no sideways scroll', async ({ page }, testInfo) => {
  const errors = await open(page, { keepOnboard: true });
  await shot(page, testInfo, 'first-screen');
  const choices = page.locator('#rmStruggleList button:visible');
  expect(await choices.count()).toBeLessThanOrEqual(3);
  await expect(page.locator('#rmBegin')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'the page scrolls sideways').toBeLessThanOrEqual(0);
  const dir = await page.locator('#rmStart').evaluate((el) => getComputedStyle(el).direction);
  expect(dir).toBe('rtl');
  expect(errors).toEqual([]);
});

test('first screen: no serious axe violations (contrast included)', async ({ page }) => {
  await open(page, { keepOnboard: true });
  expect(await axeSerious(page)).toEqual([]);
});

test('first screen: every control is at least 44×44', async ({ page }) => {
  await open(page);
  expect(await smallTargets(page, '#main > header, .who-bar, #gradePick, #remediation')).toEqual([]);
});

// Two weeks in, the typical pace is six sessions (src/lib/pace.js).
function kid(name, sessionCount, correct) {
  const now = Date.now();
  const sessions = [];
  for (let i = 0; i < sessionCount; i++) {
    const items = [];
    for (let k = 0; k < 5; k++) items.push({ skill: 'מנייה', correct: k < correct, prompt: 'q', answer: 1, given: 1 });
    sessions.push({ id: 's' + i, kind: 'diag', started: now - 14 * 86400000 + i * 86400000, ended: now, items: items });
  }
  return { name: name, created: 1, assignments: [], sessions: sessions };
}

for (const c of [
  { who: 'weak', kid: kid('נועה', 2, 1), status: 'behind', word: 'צריך חיזוק' },
  { who: 'medium', kid: kid('איתי', 6, 3), status: 'on', word: 'בקצב' },
  { who: 'strong', kid: kid('מאיה', 9, 5), status: 'ahead', word: 'מקדים' },
]) {
  test(`pace meter, ${c.who} student: «${c.word}»`, async ({ page }, testInfo) => {
    const errors = await open(page, { kid: c.kid });
    await page.locator('#tab-teacherReport').click();
    const [a, b] = (await page.locator('#adultGateQ').textContent()).match(/\d+/g).map(Number);
    await page.locator('#adultGateAnswer').fill(String(a * b));
    await page.locator('#adultGateOk').click();
    const meter = page.locator('#reportPace .mm-pace');
    await expect(meter).toHaveAttribute('data-status', c.status);
    await expect(meter.locator('.mm-pace-status b')).toHaveText(c.word);
    await expect(meter.locator('[role="progressbar"]')).toBeVisible();
    await meter.scrollIntoViewIfNeeded();
    await shot(page, testInfo, 'pace-' + c.who);
    expect(await axeSerious(page, '#reportPace')).toEqual([]);
    expect(errors).toEqual([]);
  });
}
