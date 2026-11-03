// Open findings from docs/MM-700/audit.md, one test each, marked test.fail().
// Title format: [finding ID][task ID] what the fixed app does.
// When the task's PR lands, the test reports "expected to fail, but passed":
// remove its test.fail() line in that PR.
'use strict';
const { test, expect, TABS, quickStart, answerItems, installClsObserver } = require('./_fixtures');

// ---------- MM-711 child-first home ----------
test('[B1][MM-711] the student start button is within the first two screens', async ({ page }) => {
  test.fail(true, 'B1 open: #qsStartBtn is ~6.6 screens down on phone, ~4 on desktop');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  const { y, vh } = await page.evaluate(() => ({
    y: document.getElementById('qsStartBtn').getBoundingClientRect().top + scrollY, vh: innerHeight }));
  expect(y).toBeLessThan(vh * 2);
});

// ---------- MM-712 who is playing ----------
test('[B2][MM-712] quick start without a name still records progress a teacher can see', async ({ page }) => {
  test.fail(true, 'B2 open: no mm-roster-v1 row is written unless the who-bar was filled first');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await quickStart(page, 'ב׳');
  await answerItems(page, 3);
  const rosterKeys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('mm-roster-v1:')));
  expect(rosterKeys.length).toBeGreaterThan(0);
});

// ---------- MM-713 contact link ----------
const DEAD_FORM_ID = '1FAIpQLSdT8YduNx-VWKM3bWGUJdiSj4Sw9D-EA6R6c-oYVYCQmOVXxQ'; // HTTP 410 on 2026-11-03
for (const p of ['offer.html', 'landing.html', 'index.html']) {
  test(`[M1][MM-713] ${p}: the contact-form link does not point at the deleted Google Form`, async ({ page }) => {
    test.fail(true, 'M1 open: CONTACT.form still points at a form that returns 410 Gone');
    await page.goto(p, { waitUntil: 'networkidle' });
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.href));
    expect(hrefs.filter((h) => h.includes(DEAD_FORM_ID))).toEqual([]);
  });
}

test('[M1][MM-713] live check: every contact-form link answers below 400 (needs AUDIT_CHECK_LINKS=1)', async ({ page, playwright }) => {
  test.skip(!process.env.AUDIT_CHECK_LINKS, 'network check; opt in with AUDIT_CHECK_LINKS=1');
  test.fail(true, 'M1 open: the Google Form returns 410');
  await page.goto('offer.html', { waitUntil: 'networkidle' });
  const hrefs = await page.$$eval('a[href*="docs.google.com/forms"], a[href*="github.com/Swissystem7/MelodyMath/issues"]', (as) => as.map((a) => a.href));
  expect(hrefs.length).toBeGreaterThan(0);
  const req = await playwright.request.newContext();
  try {
    for (const h of hrefs) expect((await req.get(h, { failOnStatusCode: false })).status(), h).toBeLessThan(400);
  } finally { await req.dispose(); }
});

// ---------- MM-715 tap-to-answer, grades א–ב ----------
test('[M6][MM-715] grade 1 can answer by tapping an on-screen digit pad (no OS keyboard)', async ({ page }) => {
  test.fail(true, 'M6 open: #rmAnswer is a free-text input that opens the OS keyboard');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await quickStart(page, 'א׳');
  const r = await page.evaluate(() => {
    const a = document.getElementById('rmAnswer');
    const digits = [...document.querySelectorAll('#rmQuiz button')]
      .filter((b) => b.offsetParent && /^\s*\d\s*$/.test(b.textContent)).map((b) => b.textContent.trim());
    return { noKeyboard: a.getAttribute('inputmode') === 'none' || a.readOnly, digits: new Set(digits).size };
  });
  expect(r.noKeyboard).toBe(true);
  expect(r.digits).toBe(10);
});

// ---------- MM-716 resume after reload ----------
test('[M2][MM-716] an interrupted diagnostic resumes after reload', async ({ page }) => {
  test.fail(true, 'M2 open: the run lives in memory only; reload returns to #rmStart');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await quickStart(page, 'ב׳');
  await answerItems(page, 3);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#rmQuiz')).toBeVisible({ timeout: 3000 });
});

// ---------- MM-717 local roles + PIN ----------
test('[B3][MM-717] the app offers a role choice: student, teacher, parent', async ({ page }) => {
  test.fail(true, 'B3 open: there are no roles; only an adult gate on the teacher tab');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  for (const name of [/תלמיד/, /מורה/, /הורה/]) {
    await expect(page.locator('button:visible', { hasText: name }).first()).toBeVisible({ timeout: 2000 });
  }
});

// ---------- MM-718 parent page ----------
test('[M3][MM-718] a parent can open a parent view without the teacher gate', async ({ page }) => {
  test.fail(true, 'M3 open: the parent letter exists only inside the adult-gated teacher tab');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  const entry = page.locator('a:has-text("להורים"), button:has-text("להורים"), a[href*="parent"]');
  expect(await entry.count()).toBeGreaterThan(0);
});

test('[m11][MM-718] the child\'s end-of-diagnostic screen is not a parent report', async ({ page }) => {
  test.fail(true, 'm11 open: the child sees "דוח פערים להורה" with warning tiles');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await quickStart(page, 'ה׳');
  for (let i = 0; i < 12 && !(await page.locator('#rmReport').isVisible()); i++) await answerItems(page, 1);
  await expect(page.locator('#rmReport')).toBeVisible();
  await expect(page.locator('#rmReport')).not.toContainText('להורה');
});

// ---------- MM-719 shared chrome, CLS, contrast, child-screen cleanup ----------
test('[m1][MM-719] no internal issue numbers (#NNN) on child screens', async ({ page }) => {
  test.fail(true, 'm1 open: "משחקי מוזיקה · #591"');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  for (const t of TABS) {
    await page.click('#tab-' + t);
    expect(await page.locator('#' + t).innerText(), t).not.toMatch(/#\d{3}\b/);
  }
});

for (const p of ['index.html', 'program.html']) {
  test(`[M4][MM-719] ${p}: layout shift after load stays under 0.1`, async ({ page }) => {
    test.fail(true, 'M4 open: the injected a11y bar and site nav push the page down after load');
    await installClsObserver(page);
    await page.goto(p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.__auditCls)).toBeLessThan(0.1);
  });
}

test('[m3][MM-719] offer.html eyebrow/kicker text meets 4.5:1 contrast', async ({ page }) => {
  test.fail(true, 'm3 open: #d97757 on cream is 2.96–3.12:1');
  await page.goto('offer.html', { waitUntil: 'networkidle' });
  const ratios = await page.evaluate(() => {
    const lum = (c) => {
      const m = c.match(/[\d.]+/g).map(Number);
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]);
    };
    const bg = (el) => {
      for (; el; el = el.parentElement) {
        const c = getComputedStyle(el).backgroundColor; const a = c.match(/[\d.]+/g);
        if (a && (a.length < 4 || +a[3] > 0.5)) return c;
      }
      return 'rgb(255,255,255)';
    };
    return [...document.querySelectorAll('.eyebrow, .kicker')].map((e) => {
      const a = lum(getComputedStyle(e).color); const b = lum(bg(e));
      return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
    });
  });
  expect(ratios.length).toBeGreaterThan(0);
  expect(Math.min(...ratios)).toBeGreaterThanOrEqual(4.5);
});

// ---------- MM-720 PWA polish ----------
test('[m2][MM-720] manifest has a maskable icon and its theme matches the page theme-color', async ({ page, request }) => {
  test.fail(true, 'm2 open: old purple theme_color, no maskable icon');
  await page.goto('index.html', { waitUntil: 'networkidle' });
  const m = await (await request.get(new URL('manifest.webmanifest', page.url()).href)).json();
  expect(m.icons.some((i) => /maskable/.test(i.purpose || ''))).toBe(true);
  expect(m.id).toBeTruthy();
  const meta = await page.getAttribute('meta[name=theme-color]', 'content');
  expect(m.theme_color.toLowerCase()).toBe((meta || '').toLowerCase());
  expect(m.theme_color.toLowerCase()).not.toBe('#6946e8');
});

test('[m2][MM-720] index.html declares the manifest statically (not only via core.js)', async ({ request, baseURL }) => {
  test.fail(true, 'm2 open: index.html has no static <link rel=manifest>');
  const src = await (await request.get(new URL('index.html', baseURL).href)).text();
  expect(src).toMatch(/<link[^>]+rel=["']?manifest/i);
});
