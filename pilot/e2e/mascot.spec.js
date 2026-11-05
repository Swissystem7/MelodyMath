// MM-508 — the music mascot (MM-505, made with Meta AI) loads with no 404 and
// has Hebrew alt text: on the sign-in screen and in the right-answer feedback.
'use strict';
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

async function expectMascotLoaded(img) {
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute('alt', /[֐-׿]/);
  await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
}

test('the mascot loads on the welcome screen and in the success feedback', async ({ page, baseURL }) => {
  const missing = [];
  page.on('response', (r) => { if (r.url().includes('/assets/mascot/') && r.status() !== 200) missing.push(r.status() + ' ' + r.url()); });
  const blocked = await h.openDemo(page, baseURL);

  await expectMascotLoaded(page.getByTestId('view-login').getByTestId('mascot'));
  await h.expectMobileFriendly(page);

  await h.signIn(page, 'student');
  await page.getByTestId('open-unit').click();
  await page.getByTestId('lesson-continue').click();
  await h.expectQuestion(page, 'q1');
  const fb = await h.answer(page, 7);
  await expect(fb).toHaveAttribute('data-result', 'right');
  await expectMascotLoaded(fb.getByTestId('mascot'));
  await h.expectMobileFriendly(page);

  expect(missing).toEqual([]);
  expect(blocked).toEqual([]);
});
