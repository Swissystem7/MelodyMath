// MM-7xx stream D — two devices, no server: a student practises on device 1
// and sends a code; the teacher takes it in on device 2 and sees the result,
// the gap, the last-sync time; a task goes back and its completion returns.
//
// Each device is its own browser context (own localStorage), so nothing is
// shared except the code the test carries across, exactly like two tablets.
// Viewports are set per context, so the spec runs once (project
// phone-360x740) and covers both desktop 1280x800 and phone 360x740:
//
//   npx --yes playwright@1.49 test --config e2e/playwright.config.js e2e/teacher-board --project phone-360x740
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const DEVICES = [
  { name: 'desktop 1280x800', viewport: { width: 1280, height: 800 }, hasTouch: false },
  { name: 'phone 360x740', viewport: { width: 360, height: 740 }, hasTouch: true },
];
const CLASS = 'ג2-מוזיקה';
const KID = 'נועה';

async function device(browser, baseURL, d) {
  const ctx = await browser.newContext({ baseURL, viewport: d.viewport, hasTouch: d.hasTouch, serviceWorkers: 'block', acceptDownloads: true });
  const origin = new URL(baseURL).origin;
  // Nothing may leave the device: every request to another host is refused.
  await ctx.route('**/*', (route) => (route.request().url().startsWith(origin) ? route.continue() : route.abort()));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  return { ctx, page, errors };
}

async function noSideScroll(page) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over, 'no horizontal scroll').toBeLessThanOrEqual(0);
}

async function targetsAtLeast44(page, scope) {
  const small = await page.locator(scope + ' button:visible, ' + scope + ' label.btn:visible').evaluateAll((els) =>
    els.map((el) => ({ t: el.textContent.trim(), h: el.getBoundingClientRect().height })).filter((x) => x.h < 44));
  expect(small, 'touch targets are at least 44px').toEqual([]);
}

async function openBoard(page) {
  await page.goto('class.html');
  await expect(page.locator('#gate')).toBeVisible();
  const q = await page.locator('#gateQ').textContent();
  const [, a, b] = q.match(/(\d+)\s*×\s*(\d+)/);
  await page.locator('#gateAnswer').fill(String(Number(a) * Number(b)));
  await page.locator('#gateOk').click();
  await expect(page.locator('#board')).toBeVisible();
}

for (const d of DEVICES) {
  test(`${d.name}: student exports on device 1, teacher imports on device 2 and sees the gap`, async ({ browser, baseURL }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone-360x740', 'viewports are set per context; one project runs both');
    test.setTimeout(120000);
    const kid = await device(browser, baseURL, d);
    const teacher = await device(browser, baseURL, d);

    // ---- Device 1: the student practises in the app ----
    const s = kid.page;
    await s.goto('index.html');
    await s.locator('#classCode').fill(CLASS);
    await s.locator('#studentName').fill(KID);
    await s.locator('#whoSave').click();
    await s.locator('#tab-remediation').click();
    await s.locator('#rmBegin').click();
    await expect(s.locator('#rmQuiz')).toBeVisible();
    // Both answers in the first topic wrong (a gap), both in the second right.
    const gapTopic = await s.evaluate(() => rmHe(RM_DIAG[rmIdx].skill));
    for (let i = 0; i < 4; i++) {
      const ans = await s.evaluate(() => String(RM_DIAG[rmIdx].answer));
      await s.locator('#rmAnswer').fill(i < 2 ? '9999' : ans);
      await s.locator('#rmCheck').click();
      await expect(s.locator('#rmFeedback')).toHaveClass(i < 2 ? /bad/ : /good/);
      await s.locator('#rmNext').click();
    }
    const okTopic = await s.evaluate(() => rmHe(RM_DIAG[2].skill));
    expect(okTopic).not.toBe(gapTopic);

    // ---- Device 1: send to the teacher (code + file) ----
    await s.goto('class.html#student');
    await expect(s.locator('#studentPane')).toBeVisible();
    await expect(s.locator('#meName')).toHaveText(KID);
    await expect(s.locator('#meClass')).toHaveText(CLASS);
    await expect(s.locator('#meSummary')).toContainText('4 תשובות');
    await s.locator('#makeCode').click();
    await expect(s.locator('#codeOut')).toHaveValue(/^MM2z?\./);
    const code = await s.locator('#codeOut').inputValue();
    await expect(s.locator('#codeQr svg')).toBeVisible();
    const dl = s.waitForEvent('download');
    await s.locator('#codeFile').click();
    const file = testInfo.outputPath('progress.json');
    const dlo = await dl;
    await dlo.saveAs(file);
    await dlo.delete();
    const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
    // Data minimisation: only these fields leave the student's device.
    expect(Object.keys(payload).sort()).toEqual(['a', 'c', 'g', 'k', 'n', 's', 't', 'v', 'x']);
    expect(payload.n).toBe(KID);
    expect(payload.c).toBe(CLASS);
    await noSideScroll(s);
    await targetsAtLeast44(s, '#studentPane');

    // ---- Device 2: the teacher, empty board first ----
    const t = teacher.page;
    await openBoard(t);
    await expect(t.locator('#empty')).toBeVisible();
    await expect(t.locator('#empty')).toContainText('כך מוסיפים תלמידים');
    await noSideScroll(t);
    await targetsAtLeast44(t, '#board');

    // Import by code.
    await t.locator('#importText').fill(code);
    await t.locator('#importBtn').click();
    await expect(t.locator('#importMsg')).toContainText('נקלט: ' + KID);
    await expect(t.locator('#importMsg')).toContainText('4 תשובות חדשות');
    await expect(t.locator('#empty')).toBeHidden();
    const card = t.locator(`[data-student="${KID}"]`);
    await expect(card).toBeVisible();
    await expect(card).toContainText('4 תשובות · 50% נכונות');
    await expect(card.locator('[data-sync]')).toContainText('היום');
    await expect(card.locator('[data-gaps]')).toContainText(gapTopic);
    await expect(card.locator('[data-gaps]')).not.toContainText(okTopic);
    await expect(t.locator('#classPick')).toHaveValue(CLASS);

    // The same data again, as a file: nothing doubles.
    await t.locator('#importFile').setInputFiles(file);
    await expect(t.locator('#importMsg')).toContainText('כבר נקלט');
    await expect(card).toContainText('4 תשובות');

    // By topic: the gap topic names the student.
    await t.locator('#viewTopicsBtn').click();
    const row = t.locator(`#topics tr[data-topic="${gapTopic}"]`);
    await expect(row).toContainText(KID);
    await expect(t.locator(`#topics tr[data-topic="${okTopic}"]`)).toContainText('100%');
    await noSideScroll(t);
    await t.locator('#viewStudentsBtn').click();

    // ---- Task: teacher -> student -> back ----
    await card.locator('button[data-act="task"]').click();
    await expect(t.locator('#taskTopic')).toHaveValue(gapTopic);
    await t.locator('#taskText').fill('5 תרגילים בנושא');
    await t.locator('#taskSave').click();
    await expect(t.locator('#taskCode')).toHaveValue(/^MM2z?\./);
    const tasksCode = await t.locator('#taskCode').inputValue();
    await expect(card).toContainText('0 מתוך 1 בוצעו');

    await s.locator('#studentPane details summary').last().click();
    await s.locator('#tasksIn').fill(tasksCode);
    await s.locator('#tasksInBtn').click();
    await expect(s.locator('#tasksMsg')).toContainText('משימה חדשה אחת');
    await expect(s.locator('#myTasks')).toContainText('5 תרגילים בנושא');
    await s.locator('#myTasks button[data-done]').click();
    await expect(s.locator('#myTasks')).toContainText('בוצע');
    await s.locator('#makeCode').click();
    await expect(s.locator('#codeOut')).not.toHaveValue(code);
    const code2 = await s.locator('#codeOut').inputValue();

    await t.locator('#importText').fill(code2);
    await t.locator('#importBtn').click();
    await expect(t.locator('#importMsg')).toContainText('משימה שהושלמה');
    await expect(card).toContainText('1 מתוך 1 בוצעו');

    expect(kid.errors, 'no page errors on the student device').toEqual([]);
    expect(teacher.errors, 'no page errors on the teacher device').toEqual([]);
    await teacher.ctx.close();
    // The student context holds a finished download; it closes with the worker.
  });
}

test('a QR link (#mm=code) opens the board and takes the code in after the adult question', async ({ browser, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone-360x740', 'one project is enough');
  const kid = await device(browser, baseURL, DEVICES[1]);
  await kid.page.goto('class.html#student');
  await kid.page.locator('#meClassInput').fill(CLASS);
  await kid.page.locator('#meNameInput').fill('דן');
  await kid.page.locator('#meSave').click();
  await kid.page.locator('#makeCode').click();
  const code = await kid.page.locator('#codeOut').inputValue();
  const teacher = await device(browser, baseURL, DEVICES[1]);
  const t = teacher.page;
  await t.goto('class.html#mm=' + code);
  await expect(t.locator('#gateMsg')).toContainText('התקבל קוד');
  const q = await t.locator('#gateQ').textContent();
  const [, a, b] = q.match(/(\d+)\s*×\s*(\d+)/);
  await t.locator('#gateAnswer').fill(String(Number(a) * Number(b)));
  await t.locator('#gateOk').click();
  await expect(t.locator('#importMsg')).toContainText('נקלט: דן');
  await expect(t.locator('[data-student="דן"] [data-sync]')).toContainText('היום');
  expect(await t.evaluate(() => location.hash)).toBe('');
  // Privacy: a full name is refused on the student side.
  await kid.page.locator('#meChange').click();
  await kid.page.locator('#meNameInput').fill('דן בן כהן');
  await kid.page.locator('#meSave').click();
  await expect(kid.page.locator('#meMsg')).toContainText('בלי שם משפחה');
  await kid.ctx.close();
  await teacher.ctx.close();
});
