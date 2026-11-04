// MM-602 — an old cached pilot file next to the new app.js must not break the demo.
// After #957 a browser that had cached the MM-600 pilot loaded the old (or no)
// js/music.js with the new js/app.js: window.MMPilotMusic was undefined, stopSound()
// threw and sign-in silently failed. app.js now reaches the music code only through
// a fail-safe helper: it warns once in the console, plays no sound, and every flow
// still works. Both cases are simulated here: music.js not loading at all, and an
// old music.js that lacks the MM-601 functions.
'use strict';
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

async function watch(page) {
  const seen = { warnings: [], errors: [] };
  page.on('console', (m) => { if (m.type() === 'warning') seen.warnings.push(m.text()); });
  page.on('pageerror', (e) => seen.errors.push(String(e && e.message || e)));
  return seen;
}

async function studentAnswersOne(page) {
  await h.signIn(page, 'student');
  await page.getByTestId('open-unit').click();
  await h.passCheck(page, 'pre'); // MM-610: the short check before the unit
  await expect(page.getByTestId('view-lesson')).toBeVisible();
  await page.getByTestId('lesson-play').click();                 // plays nothing, does not throw
  await expect(page.getByTestId('lesson-status')).not.toHaveAttribute('data-audio', 'played');
  await page.getByTestId('lesson-continue').click();               // calls stopSound()
  await h.expectQuestion(page, 'q1');
  await expect(page.getByTestId('music-card')).toBeVisible();
  const fb = await h.answer(page, 7);
  await expect(fb).toHaveAttribute('data-result', 'right');
  await expect(fb).not.toHaveAttribute('data-audio', 'played');
  await page.getByTestId('sound-toggle').click();
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  await h.expectMobileFriendly(page);
}

function expectOneMusicWarning(seen) {
  const music = seen.warnings.filter((w) => /music is unavailable/.test(w));
  expect(music.length, 'warnings: ' + JSON.stringify(seen.warnings)).toBe(1);
  expect(seen.errors).toEqual([]);
}

test.describe('an old or missing js/music.js (cache mix after #957)', () => {
  test('music.js does not load: sign-in works, an exercise is answered, one console warning, no page errors', async ({ page, baseURL }) => {
    const seen = await watch(page);
    const blocked = await h.isolate(page, baseURL);
    await page.route('**/pilot/js/music.js*', (route) => route.abort());
    await h.stubAudio(page);
    await page.goto(h.PAGE);
    await expect(page.locator('html')).toHaveAttribute('data-ready', '1');
    expect(await page.evaluate(() => typeof window.MMPilotMusic)).toBe('undefined');

    await studentAnswersOne(page);
    expectOneMusicWarning(seen);
    expect(blocked).toEqual([]);
  });

  test('an old music.js without the MM-601 functions: student and teacher flows still work', async ({ page, baseURL }) => {
    const seen = await watch(page);
    const blocked = await h.isolate(page, baseURL);
    await page.route('**/pilot/js/music.js*', (route) => route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.MMPilotMusic = { play: function () { return "played"; } };'
    }));
    await h.stubAudio(page);
    await page.goto(h.PAGE);
    await expect(page.locator('html')).toHaveAttribute('data-ready', '1');
    expect(await page.evaluate(() => typeof window.MMPilotMusic.stop)).toBe('undefined');

    await studentAnswersOne(page);
    await h.signOut(page);
    await h.signIn(page, 'teacher');
    await expect(page.getByTestId('view-teacher')).toBeVisible();
    await h.expectMobileFriendly(page);
    expectOneMusicWarning(seen);
    expect(blocked).toEqual([]);
  });
});
