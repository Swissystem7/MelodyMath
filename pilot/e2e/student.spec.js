// MM-600 pilot — student flow: demo sign-in, lesson, exercises, audio feedback
// (stubbed Web Audio, asserted through the UI state), saved progress after reload.
// MM-601: the exercises are music (notes asserted through the window.__mmPilotMusic
// hook), and q7 is the fraction rhythm exercise.
'use strict';
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

test.describe('student unit flow (grades 1–3)', () => {
  test('page is Hebrew RTL and the demo sign-in rejects a wrong password', async ({ page, baseURL }) => {
    const blocked = await h.openDemo(page, baseURL);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');
    await h.expectMobileFriendly(page);

    await page.getByTestId('login-username').fill(h.account('student').username);
    await page.getByTestId('login-password').fill('not-the-demo-password');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page.getByTestId('view-login')).toBeVisible();
    expect(blocked).toEqual([]);
  });

  test('student completes the unit with sound feedback and the progress survives reloads', async ({ page, baseURL }) => {
    const blocked = await h.openDemo(page, baseURL);
    await h.signIn(page, 'student');
    await expect(page.getByTestId('no-assignment')).toBeVisible();
    await expect(page.getByTestId('unit-status')).toHaveAttribute('data-status', 'new');
    await h.expectMobileFriendly(page);

    // Lesson: "every note is 1" — 3 notes and 2 more; the play button sends notes to the shared engine.
    await page.getByTestId('open-unit').click();
    await h.passCheck(page, 'pre'); // MM-610: the short check before the unit
    await expect(page.getByTestId('view-lesson')).toBeVisible();
    await h.expectMobileFriendly(page);
    await page.getByTestId('lesson-play').click();
    await expect(page.getByTestId('lesson-status')).toHaveAttribute('data-audio', 'played');
    await expect(page.getByTestId('lesson-status')).toContainText('3 צלילים');
    await expect(page.getByTestId('lesson-caption')).toContainText('ועוד');
    const lesson = await h.lastPlay(page, 'lesson');
    expect(lesson.notes.filter((n) => n.role === 'a').length).toBe(3);
    expect(lesson.notes.filter((n) => n.role === 'b').length).toBe(2);
    expect(await page.evaluate(() => window.__mmAudio.started)).toBeGreaterThan(0);
    await page.getByTestId('lesson-continue').click();

    // q1 4+3: right on the first try, with sound.
    await h.expectQuestion(page, 'q1');
    await expect(page.getByTestId('check')).toBeDisabled();
    await h.expectMobileFriendly(page);
    const before = await page.evaluate(() => window.__mmAudio.started);
    let fb = await h.answer(page, 7);
    await expect(fb).toHaveAttribute('data-result', 'right');
    await expect(fb).toHaveAttribute('data-audio', 'played');
    await expect(page.getByTestId('feedback-sound')).toContainText('הביתה');
    await expect(page.getByTestId('music-caption')).toContainText('= 7');
    expect(await page.evaluate(() => window.__mmAudio.started)).toBeGreaterThan(before);
    await expect(page.getByTestId('star-count')).toContainText('1');
    await h.expectMobileFriendly(page);
    await page.getByTestId('next').click();

    // q2 8+5: wrong first (hint, gentle sound), then right.
    await h.expectQuestion(page, 'q2');
    fb = await h.answer(page, 12);
    await expect(fb).toHaveAttribute('data-result', 'wrong');
    await expect(fb).toHaveAttribute('data-audio', 'played');
    await expect(page.getByTestId('hint')).toContainText('קדימה');
    await expect(page.getByTestId('hint')).not.toContainText('13');
    await h.expectMobileFriendly(page);
    fb = await h.answer(page, 13);
    await expect(fb).toHaveAttribute('data-result', 'right');
    await page.getByTestId('next').click();
    await h.expectQuestion(page, 'q3');

    // Reload mid-unit: still signed in, progress kept, resumes at q3.
    await page.reload();
    await expect(page.getByTestId('view-student-home')).toBeVisible();
    await expect(page.getByTestId('unit-status')).toHaveAttribute('data-status', 'progress');
    await expect(page.getByTestId('unit-status')).toContainText('2 מתוך 7');
    await page.getByTestId('open-unit').click();
    await h.passCheck(page, 'pre'); // MM-610: the short check before the unit
    await h.expectQuestion(page, 'q3');

    // q3 9-4 right; q4 15-6 wrong twice, so the answer is shown and we move on.
    fb = await h.answer(page, 5);
    await expect(fb).toHaveAttribute('data-result', 'right');
    await page.getByTestId('next').click();
    await h.expectQuestion(page, 'q4');
    fb = await h.answer(page, 8);
    await expect(fb).toHaveAttribute('data-result', 'wrong');
    fb = await h.answer(page, 7);
    await expect(fb).toHaveAttribute('data-result', 'revealed');
    await expect(fb).toContainText('9');
    await page.getByTestId('next').click();

    // q5, q6: jumps of 10 (an octave on the grade-1 scale).
    await h.expectQuestion(page, 'q5');
    fb = await h.answer(page, 16);
    await expect(fb).toHaveAttribute('data-result', 'right');
    await expect(page.getByTestId('music-caption')).toContainText('עשרת אחת');
    await page.getByTestId('next').click();
    await h.expectQuestion(page, 'q6');
    fb = await h.answer(page, 10);
    await expect(fb).toHaveAttribute('data-result', 'right');
    await page.getByTestId('next').click();

    // q7: the fraction rhythm exercise — a quarter is too short (the bar is not full), a half fills it.
    await h.expectQuestion(page, 'q7');
    await expect(page.getByTestId('rhythm-bar')).toHaveAttribute('data-fill', 'open');
    await h.expectMobileFriendly(page);
    fb = await h.answerRhythm(page, 'quarter');
    await expect(fb).toHaveAttribute('data-result', 'wrong');
    await expect(page.getByTestId('rhythm-bar')).toHaveAttribute('data-fill', 'short');
    await expect(page.getByTestId('hint')).toContainText('ארוך יותר');
    fb = await h.answerRhythm(page, 'half');
    await expect(fb).toHaveAttribute('data-result', 'right');
    await expect(page.getByTestId('rhythm-bar')).toHaveAttribute('data-fill', 'full');
    await page.getByTestId('next').click();

    // Summary: saved, per topic (4 of 7 right on the first try = one star).
    await h.passCheck(page, 'post'); // MM-610: the short check after the unit
    await expect(page.getByTestId('view-summary')).toBeVisible();
    await expect(page.getByTestId('saved')).toBeVisible();
    await expect(page.getByTestId('summary-stars')).toHaveText('★☆☆');
    await expect(page.locator('[data-testid="summary-topic"][data-topic="frac"]')).toContainText('0 מתוך 1');
    await expect(page.locator('[data-testid="summary-topic"][data-topic="tens"]')).toContainText('2 מתוך 2');
    await h.expectMobileFriendly(page);

    // Reload after the unit: done, stars kept.
    await page.reload();
    await expect(page.getByTestId('unit-status')).toHaveAttribute('data-status', 'done');
    await expect(page.getByTestId('unit-stars')).toHaveText('★☆☆');
    expect(blocked).toEqual([]);
  });
});
