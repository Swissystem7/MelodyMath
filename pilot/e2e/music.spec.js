// MM-601 pilot — the music is the math: every exercise schedules the notes of
// its sum (asserted through the window.__mmPilotMusic hook, never a speaker),
// the caption names what is heard but not the answer, the demo works with the
// sound off, the fraction rhythm exercise works from the keyboard, and the
// teacher view shows curriculum coverage and the "למה זה עובד" panel.
'use strict';
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

const counted = (play) => play.notes.filter((n) => ['a', 'b', 'one', 'ten', 'removed', 'removed-ten'].includes(n.role));

async function startUnit(page) {
  await h.signIn(page, 'student');
  await page.getByTestId('open-unit').click();
  await h.passCheck(page, 'pre'); // MM-610: the short check before the unit
  await page.getByTestId('lesson-continue').click();
}

test.describe('music in every exercise', () => {
  test('each exercise plays its numbers as notes, captions never leak the answer, a right answer resolves', async ({ page, baseURL }) => {
    const blocked = await h.openDemo(page, baseURL);
    await startUnit(page);

    // q1 4 + 3 (a04): a strip of 10 beats, planned by score.js. The 3 added beats
    // are one held note of 2 beats and one short note: beats are counted, not notes.
    await h.expectQuestion(page, 'q1');
    let play = await h.lastPlay(page, 'q1:question');
    expect(play.audio).toBe('played');
    let held = play.notes.filter((n) => n.role === 'held');
    expect(held).toHaveLength(6);
    expect(held.filter((n) => n.voice === 'keys')).toHaveLength(4);
    expect(held.filter((n) => n.voice === 'woodBar')).toHaveLength(2);
    expect(held.filter((n) => n.dur > 1.5 * held[0].dur)).toHaveLength(1);
    expect(play.notes.filter((n) => n.role === 'click')).toHaveLength(10);
    expect(play.notes.some((n) => n.role === 'home')).toBe(false);
    await expect(page.getByTestId('music-notes')).toHaveAttribute('data-count', '6');
    await expect(page.getByTestId('music-caption')).toContainText('4 פעימות בפסנתר');
    await expect(page.getByTestId('music-caption')).not.toContainText('7');
    await expect(page.getByTestId('music-describe')).not.toContainText('7');
    await expect(page.getByTestId('q-curriculum')).toContainText('mm-cur-3');
    await h.answer(page, 7);
    play = await h.lastPlay(page, 'q1:right');
    expect(play.notes.filter((n) => n.role === 'home').map((n) => n.note)).toEqual(['C4', 'E4', 'G4']);
    await expect(page.getByTestId('music-caption')).toHaveAttribute('data-stage', 'solved');
    await expect(page.getByTestId('why-text')).toContainText('= 7');
    await page.getByTestId('next').click();

    // q2 8 + 5, wrong first: the held note fills the cycle to 10 and 3 beats go on;
    // the hint replays the same strip slower and stops before home.
    await h.expectQuestion(page, 'q2');
    const q2 = await h.lastPlay(page, 'q2:question');
    await h.answer(page, 12);
    const hint = await h.lastPlay(page, 'q2:hint');
    expect(hint.notes.filter((n) => n.role === 'held')).toHaveLength(12);
    expect(hint.notes.some((n) => n.role === 'home')).toBe(false);
    expect(hint.notes[hint.notes.length - 1].at).toBeGreaterThan(q2.notes[q2.notes.length - 1].at);
    await expect(page.getByTestId('why-text')).not.toContainText('13');
    await h.answer(page, 13);
    await page.getByTestId('next').click();

    // q3 9 − 4: the last four beats are taken away (✕, silent); five beats still sound.
    await h.expectQuestion(page, 'q3');
    play = await h.lastPlay(page, 'q3:question');
    expect(play.notes.filter((n) => n.role === 'held')).toHaveLength(5);
    await expect(page.locator('[data-testid="music-notes"] [data-role="rest"]').filter({ hasText: '✕' })).toHaveCount(4);
    await expect(page.getByTestId('music-caption')).not.toContainText('5');
    await h.answer(page, 5);
    play = await h.lastPlay(page, 'q3:right');
    expect(play.notes.filter((n) => n.role === 'held')).toHaveLength(5);
    await page.getByTestId('next').click();
    await h.answer(page, 9);
    await page.getByTestId('next').click();

    // q5 6 + 10: six xylophone ones and one low organ ten; solved in place-value order.
    await h.expectQuestion(page, 'q5');
    play = await h.lastPlay(page, 'q5:question');
    expect(play.notes.filter((n) => n.role === 'one')).toHaveLength(6);
    expect(play.notes.filter((n) => n.role === 'ten').map((n) => [n.note, n.voice])).toEqual([['C3', 'organ']]);
    await expect(page.getByTestId('music-caption')).not.toContainText('16');
    await h.answer(page, 16);
    play = await h.lastPlay(page, 'q5:right');
    expect(counted(play)[0].role).toBe('ten');
    await page.getByTestId('next').click();
    await h.answer(page, 10);
    await page.getByTestId('next').click();

    // q7: the 4/4 bar at 90 BPM — four clicks, two given quarters; the half note fills beats 3–4.
    await h.expectQuestion(page, 'q7');
    play = await h.lastPlay(page, 'q7:question');
    expect(play.notes.filter((n) => n.role === 'click')).toHaveLength(4);
    expect(play.notes.filter((n) => n.role === 'given').map((n) => n.note)).toEqual(['E4', 'D4']);
    await expect(page.getByTestId('music-caption')).not.toContainText('1/2');
    await expect(page.getByTestId('music-caption')).not.toContainText('חצי');
    await expect(page.getByTestId('q-curriculum')).toContainText('mm-cur-32');
    await h.answerRhythm(page, 'whole');
    play = await h.lastPlay(page, 'q7:hint');
    expect(play.notes.filter((n) => n.role === 'click-over').length).toBeGreaterThan(0);
    await expect(page.getByTestId('rhythm-bar')).toHaveAttribute('data-fill', 'over');
    await expect(page.getByTestId('hint')).toContainText('קצר יותר');
    await expect(page.getByTestId('hint')).not.toContainText('1/2');
    await h.answerRhythm(page, 'half');
    play = await h.lastPlay(page, 'q7:right');
    const chosen = play.notes.find((n) => n.role === 'chosen');
    const beat = 60 / 90;
    expect(chosen.note).toBe('C4');
    expect(chosen.at).toBeCloseTo(2 * beat, 2);
    expect(chosen.dur).toBeGreaterThan(1.8 * beat);
    expect(chosen.dur).toBeLessThanOrEqual(2 * beat);
    await expect(page.getByTestId('music-caption')).toContainText('1/4 + 1/4 + 1/2 = 1');
    expect(blocked).toEqual([]);
  });

  test('with the sound off nothing is scheduled, and the notes and captions are still there', async ({ page, baseURL }) => {
    await h.openDemo(page, baseURL);
    await startUnit(page);
    await page.getByTestId('sound-toggle').click();
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
    const started = await page.evaluate(() => window.__mmAudio.started);
    await page.getByTestId('replay').click();
    expect((await h.lastPlay(page, 'q1:question')).audio).toBe('silent');
    await expect(page.getByTestId('music-notes')).toHaveAttribute('data-count', '6');
    await expect(page.getByTestId('music-caption')).toContainText('בפסנתר');
    const fb = await h.answer(page, 7);
    await expect(fb).toHaveAttribute('data-audio', 'silent');
    await expect(page.getByTestId('feedback-sound')).toContainText('הצליל כבוי');
    expect(await page.evaluate(() => window.__mmAudio.started)).toBe(started);
    await h.expectMobileFriendly(page);
  });

  test('the fraction rhythm exercise works from the keyboard', async ({ page, baseURL }) => {
    await h.openDemo(page, baseURL);
    await startUnit(page);
    for (const v of [7, 13, 5, 9, 16, 10]) { await h.answer(page, v); await page.getByTestId('next').click(); }
    await h.expectQuestion(page, 'q7');
    await expect(page.getByTestId('view-exercise')).toHaveAttribute('data-kind', 'rhythm');
    await h.expectMobileFriendly(page);
    await page.keyboard.press('2'); // the second rhythm: half a bar
    await expect(page.getByTestId('choice-half')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('choice-half')).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('check')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('feedback')).toHaveAttribute('data-result', 'right');
    await expect(page.getByTestId('rhythm-bar')).toHaveAttribute('data-fill', 'full');
    await expect(page.getByTestId('next')).toBeFocused();
    await h.expectMobileFriendly(page);
  });
});

test.describe('teacher: curriculum coverage and why it works', () => {
  test('coverage cites the official topics and the why-it-works panel opens with sourced claims', async ({ page, baseURL }) => {
    const blocked = await h.openDemo(page, baseURL);
    await h.signIn(page, 'teacher');

    const cov = page.getByTestId('coverage');
    await expect(cov.getByTestId('coverage-row')).toHaveCount(4);
    const ids = await cov.getByTestId('coverage-topic').evaluateAll((els) => els.map((e) => e.getAttribute('data-topic-id')));
    expect(ids).toEqual(['mm-cur-3', 'mm-cur-3', 'mm-cur-5', 'mm-cur-4', 'mm-cur-32']);
    const frac = cov.locator('[data-testid="coverage-row"][data-topic="frac"]');
    await expect(frac).toContainText('משמעות השבר כחלק משלם');
    await expect(frac.getByTestId('coverage-source')).toHaveAttribute('href', /Newprogramgrade4\.pdf#page=11$/);
    await expect(frac.getByTestId('coverage-note')).toContainText('כיתה ד׳');
    await expect(cov.locator('[data-testid="coverage-row"][data-topic="add"] [data-testid="coverage-source"]')).toHaveAttribute('href', /Newprogramgrade1\.pdf#page=6$/);

    await expect(page.getByTestId('why-panel')).toBeHidden();
    await page.getByTestId('why-open').click();
    await expect(page.getByTestId('why-open')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('why-panel')).toBeVisible();
    const claims = page.getByTestId('why-claim');
    const n = await claims.count();
    expect(n).toBeGreaterThanOrEqual(3);
    expect(n).toBeLessThanOrEqual(5);
    for (let i = 0; i < n; i++) {
      await expect(claims.nth(i)).toContainText('מה זה לא מראה');
      await expect(claims.nth(i).getByTestId('why-source')).toContainText(/\d{4}/);
    }
    await expect(page.getByTestId('why-panel')).toContainText('Azaryahu');
    await expect(page.getByTestId('why-honest')).toContainText('עוד לא נבדק');
    await h.expectMobileFriendly(page);
    await page.getByTestId('why-open').click();
    await expect(page.getByTestId('why-panel')).toBeHidden();
    expect(blocked).toEqual([]);
  });
});
