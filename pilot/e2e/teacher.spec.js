// MM-600 pilot — teacher flow: demo sign-in, assign a task, the student sees it,
// the student's results show up in the teacher's report by topic and gaps (same device).
'use strict';
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

const NOTE = 'לתרגל לפני יום ראשון';

test.describe('teacher assign + report', () => {
  test('teacher assigns, student sees and completes it, report shows topics and gaps', async ({ page, baseURL }) => {
    const blocked = await h.openDemo(page, baseURL);

    // Teacher: empty report, then assign the unit with a note.
    await h.signIn(page, 'teacher');
    await expect(page.getByTestId('report-empty')).toBeVisible();
    await expect(page.getByTestId('no-assignments')).toBeVisible();
    await h.expectMobileFriendly(page);
    await page.getByTestId('assign-student').selectOption(h.account('student').id);
    await page.getByTestId('assign-note').fill(NOTE);
    await page.getByTestId('assign-submit').click();
    await expect(page.getByTestId('assign-status')).toContainText('הוקצתה');
    await expect(page.getByTestId('assignment-row')).toHaveCount(1);
    await expect(page.getByTestId('assignment-status')).toHaveAttribute('data-status', 'new');
    await h.signOut(page);

    // Student (same device): the assignment and the teacher's note are there.
    await h.signIn(page, 'student');
    await expect(page.getByTestId('assignment-card')).toBeVisible();
    await expect(page.getByTestId('assignment-note')).toHaveText(NOTE);
    await page.getByTestId('open-unit').click();
    await h.passCheck(page, 'pre'); // MM-610: the short check before the unit
    await page.getByTestId('lesson-continue').click();
    const plan = [['q1', [7]], ['q2', [13]], ['q3', [6, 5]], ['q4', [9]], ['q5', [16]], ['q6', [10]], ['q7', ['half']]];
    for (const [qid, tries] of plan) {
      await h.expectQuestion(page, qid);
      for (const t of tries) await (typeof t === 'number' ? h.answer(page, t) : h.answerRhythm(page, t));
      await expect(page.getByTestId('feedback')).toHaveAttribute('data-result', 'right');
      await page.getByTestId('next').click();
    }
    await h.passCheck(page, 'post'); // MM-610: the short check after the unit
    await expect(page.getByTestId('view-summary')).toBeVisible();
    await h.signOut(page);

    // Teacher again: status done, report by topic, subtraction is the gap.
    await h.signIn(page, 'teacher');
    await expect(page.getByTestId('assignment-status')).toHaveAttribute('data-status', 'done');
    const student = page.locator('[data-testid="report-student"][data-student="' + h.account('student').id + '"]');
    await expect(student.getByTestId('report-table')).toBeVisible();
    const row = (t) => student.locator('[data-testid="report-row"][data-topic="' + t + '"]');
    await expect(row('add')).toHaveAttribute('data-status', 'ok');
    await expect(row('add').getByTestId('report-pct')).toHaveText('100%');
    await expect(row('sub')).toHaveAttribute('data-status', 'gap');
    await expect(row('sub').getByTestId('report-pct')).toHaveText('50%');
    await expect(row('sub').getByTestId('report-status')).toHaveText('פער');
    await expect(row('tens')).toHaveAttribute('data-status', 'ok');
    // MM-601: the fraction rhythm topic is in the report, with its curriculum id.
    await expect(row('frac')).toHaveAttribute('data-status', 'ok');
    await expect(row('frac').getByTestId('report-pct')).toHaveText('100%');
    await expect(row('frac').getByTestId('report-curriculum')).toHaveText('mm-cur-32');
    await expect(row('sub').getByTestId('report-curriculum')).toHaveText('mm-cur-3');
    await expect(student.getByTestId('gap')).toHaveCount(1);
    await expect(student.locator('[data-testid="gap"][data-topic="sub"]')).toContainText('חיסור');
    await h.expectMobileFriendly(page);

    // Still there after a reload.
    await page.reload();
    await expect(page.getByTestId('view-teacher')).toBeVisible();
    await expect(student.locator('[data-testid="gap"][data-topic="sub"]')).toBeVisible();
    expect(blocked).toEqual([]);
  });

  test('reset clears the demo data on this device only after a second tap', async ({ page, baseURL }) => {
    const blocked = await h.openDemo(page, baseURL);
    await h.signIn(page, 'teacher');
    await page.getByTestId('assign-submit').click();
    await expect(page.getByTestId('assignment-row')).toHaveCount(1);
    await page.getByTestId('reset').click();
    await expect(page.getByTestId('view-teacher')).toBeVisible();
    await page.getByTestId('reset').click();
    await expect(page.getByTestId('view-login')).toBeVisible();
    await h.signIn(page, 'teacher');
    await expect(page.getByTestId('no-assignments')).toBeVisible();
    expect(blocked).toEqual([]);
  });
});

// Class mode: several children share the student sign-in on one device. Each
// picks a number; nothing is kept by name.
test.describe('class mode: a number per child, no names', () => {
  test('two children on one device keep separate progress, and the teacher sees each by number', async ({ page, baseURL }) => {
    await h.openDemo(page, baseURL);
    await h.signIn(page, 'teacher');
    await expect(page.getByTestId('class-status')).toHaveAttribute('data-size', '0');
    await page.getByTestId('class-size').selectOption('5');
    await page.getByTestId('class-save').click();
    await expect(page.getByTestId('class-status')).toHaveAttribute('data-size', '5');
    await expect(page.locator('[data-testid="assign-student"] option')).toHaveCount(5);
    await h.expectMobileFriendly(page);
    await h.signOut(page);

    // child 3: the check before, with one right answer
    const a = h.account('student');
    await page.getByTestId('login-username').fill(a.username);
    await page.getByTestId('login-password').fill(a.password);
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('view-who')).toBeVisible();
    await expect(page.locator('[data-act="child"]')).toHaveCount(5);
    await h.expectMobileFriendly(page);
    await page.getByTestId('child-3').click();
    await expect(page.getByTestId('view-student-home')).toBeVisible();
    await expect(page.locator('h1')).toContainText('ילד/ה 3');
    await page.getByTestId('open-unit').click();
    await h.passCheck(page, 'pre', { 'm1-pre1': '12', 'm1-pre2': '5' });
    await expect(page.getByTestId('view-lesson')).toBeVisible();
    // a reload keeps the same child signed in
    await page.reload();
    await expect(page.getByTestId('view-student-home')).toBeVisible();
    await expect(page.locator('h1')).toContainText('ילד/ה 3');
    await expect(page.getByTestId('unit-status')).toHaveAttribute('data-status', 'progress');
    await h.signOut(page);

    // child 4 starts from nothing
    await page.getByTestId('login-username').fill(a.username);
    await page.getByTestId('login-password').fill(a.password);
    await page.getByTestId('login-submit').click();
    await page.getByTestId('child-4').click();
    await expect(page.locator('h1')).toContainText('ילד/ה 4');
    await expect(page.getByTestId('unit-status')).toHaveAttribute('data-status', 'new');
    await h.signOut(page);

    // the teacher sees child 3 only (child 4 has no data), by number
    await h.signIn(page, 'teacher');
    await expect(page.getByTestId('report-student')).toHaveCount(1);
    await expect(page.getByTestId('report-student')).toContainText('ילד/ה 3');
    await expect(page.getByTestId('report-prepost')).toHaveAttribute('data-pre', '1/3');
    const dl = page.waitForEvent('download');
    await page.getByTestId('export-checks').click();
    const csv = require('fs').readFileSync(await (await dl).path(), 'utf8');
    expect(csv).toContain('ילד/ה 3,music-1,1,3,');
    // turning class mode off brings back the single student
    await page.getByTestId('class-size').selectOption('0');
    await page.getByTestId('class-save').click();
    await expect(page.locator('[data-testid="assign-student"] option')).toHaveCount(1);
  });
});
