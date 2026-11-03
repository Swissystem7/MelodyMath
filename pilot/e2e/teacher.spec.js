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
    await page.getByTestId('lesson-continue').click();
    const plan = [['q1', [7]], ['q2', [13]], ['q3', [6, 5]], ['q4', [9]], ['q5', [16]], ['q6', [10]]];
    for (const [qid, tries] of plan) {
      await h.expectQuestion(page, qid);
      for (const t of tries) await h.answer(page, t);
      await expect(page.getByTestId('feedback')).toHaveAttribute('data-result', 'right');
      await page.getByTestId('next').click();
    }
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
    await h.openDemo(page, baseURL);
    await h.signIn(page, 'teacher');
    await page.getByTestId('assign-submit').click();
    await expect(page.getByTestId('assignment-row')).toHaveCount(1);
    await page.getByTestId('reset').click();
    await expect(page.getByTestId('view-teacher')).toBeVisible();
    await page.getByTestId('reset').click();
    await expect(page.getByTestId('view-login')).toBeVisible();
    await h.signIn(page, 'teacher');
    await expect(page.getByTestId('no-assignments')).toBeVisible();
  });
});
