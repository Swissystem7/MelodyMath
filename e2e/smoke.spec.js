// Smoke pass over the live site (#419): every page loads, every home tab and
// the buttons in its panel click through, and the demo flow — diagnosis, then
// practice on the gaps it found, then the teacher report — runs end to end.
// Zero page errors, zero console errors, zero 4xx/5xx responses throughout.
//
// Live:  node tools/e2e-live.js --force        (what runs after each deploy)
// Local: npx --yes playwright@1.49 test --config e2e/playwright.config.js smoke
// Paths are relative so the same file works under /MelodyMath/ on Pages.
const { test, expect } = require('@playwright/test');

const PAGES = ['index', 'curriculum', 'landing', 'offer', 'frequency', 'functions', '807', 'check', 'demo'];
const TABS = ['remediation', 'lessons', 'practice', 'playground', 'musicGames', 'classMode', 'beatMode', 'teacherReport'];
// Enough to reach every button a panel shows at first, without wandering
// into a full exercise run.
const MAX_CLICKS = 12;

// Collects everything that should make a smoke test fail.
function watch(page) {
  const problems = [];
  page.on('pageerror', (e) => problems.push('pageerror: ' + String(e)));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) problems.push(r.status() + ' ' + r.url()); });
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  return problems;
}

test.beforeEach(async ({ page }) => {
  // A print dialog would hang a headless run; the button wiring still runs.
  await page.addInitScript(() => { window.print = () => {}; });
});

for (const name of PAGES) {
  test(name + '.html loads with 200 and no errors', async ({ page }) => {
    const problems = watch(page);
    const res = await page.goto(name + '.html');
    expect(res.status(), name + '.html status').toBe(200);
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/\S/);
    await page.waitForLoadState('networkidle');
    expect(problems).toEqual([]);
  });
}

async function openTab(page, tab) {
  await page.locator('#tab-' + tab).click();
  if (tab === 'teacherReport') {
    // Adult gate (#737): answer the two-digit product.
    const [a, b] = (await page.locator('#adultGateQ').textContent()).match(/\d+/g).map(Number);
    await page.locator('#adultGateAnswer').fill(String(a * b));
    await page.locator('#adultGateOk').click();
  }
  await expect(page.locator('#tab-' + tab)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#' + tab)).toBeVisible();
}

// Clicks each visible, enabled button in the panel once. Re-queries after
// every click because a click often swaps which card is showing.
async function clickPanelButtons(page, tab) {
  const seen = new Set();
  for (let round = 0; round < MAX_CLICKS; round++) {
    const buttons = page.locator('#' + tab + ' button:visible:enabled');
    const n = await buttons.count();
    let next = null;
    for (let i = 0; i < n && !next; i++) {
      const b = buttons.nth(i);
      const key = (await b.getAttribute('id')) || ((await b.textContent()) || '').trim();
      if (!seen.has(key)) { seen.add(key); next = b; }
    }
    if (!next) break;
    // A button can slide under a card that opened a moment ago; that is
    // layout timing, not a bug, so only errors and bad responses count.
    await next.click({ timeout: 3000 }).catch(() => {});
    await page.keyboard.press('Escape');
    if (!new URL(page.url()).pathname.endsWith('/index.html')) {
      await page.goBack();
      await openTab(page, tab);
    }
  }
  return seen.size;
}

test('every home tab opens and its panel buttons click without errors', async ({ page }) => {
  const problems = watch(page);
  await page.goto('index.html');
  await expect(page.locator('.tabs [role="tab"]')).toHaveCount(TABS.length);
  for (const tab of TABS) {
    await openTab(page, tab);
    const clicked = await clickPanelButtons(page, tab);
    expect(clicked, tab + ': no buttons to click').toBeGreaterThan(0);
    expect(problems, 'after the ' + tab + ' tab').toEqual([]);
  }
});

test('diagnosis, then practice on the gaps, then the teacher report', async ({ page }) => {
  const problems = watch(page);
  await page.goto('index.html');

  // The teacher report only fills for a saved student on this device.
  await page.locator('#classCode').fill('e2e');
  await page.locator('#studentName').fill('בדיקה');
  await page.locator('#whoSave').click();
  await page.locator('#gradePick button[data-grade="א"]').click();

  // Diagnosis: a wrong answer everywhere, so every skill becomes a gap.
  await page.locator('#rmBegin').click();
  await expect(page.locator('#rmQuiz')).toBeVisible();
  for (let i = 0; i < 60 && !(await page.locator('#rmReport').isVisible()); i++) {
    await page.locator('#rmAnswer').fill('999');
    await page.locator('#rmCheck').click();
    await page.locator('#rmNext').click();
  }
  await expect(page.locator('#rmReport')).toBeVisible();
  await expect(page.locator('#rmStats .stat').first()).toBeVisible();
  await expect(page.locator('#rmSummary b')).not.toBeEmpty();
  const gaps = await page.locator('#rmSummary b').textContent();

  // Practice starts from the first gap the diagnosis named.
  await page.locator('#rmPractice').click();
  await expect(page.locator('#rmPlan')).toBeVisible();
  const skill = ((await page.locator('#rmPlanSkill').textContent()) || '').split(' · ')[0];
  expect(gaps).toContain(skill);
  for (let i = 0; i < 2; i++) {
    await page.locator('#rmPlanAnswer').fill('999');
    await page.locator('#rmPlanCheck').click();
    await expect(page.locator('#rmPlanFeedback')).toBeVisible();
    await page.locator('#rmPlanNext').click();
  }

  // The teacher report shows what was just logged.
  await openTab(page, 'teacherReport');
  await page.locator('#reportRefresh').click();
  await expect(page.locator('#reportBody')).toBeVisible();
  await expect(page.locator('#reportEmpty')).toBeHidden();
  await expect(page.locator('#reportSkills')).toContainText(skill);
  expect(problems).toEqual([]);
});
