// MM-600 pilot — the way in and the offline copy:
//  1. the home page (index.html) links to the demo from the teacher kit, behind the
//     existing adult gate, and the link opens the pilot;
//  2. after one online visit the site's service worker (sw.js) has the pilot files,
//     so the demo loads and signs in with the network off (context.setOffline).
// The other specs run with service workers blocked (playwright.config.js) so their
// page.route isolation sees every request; only the offline test allows them.
'use strict';
const { test, expect } = require('@playwright/test');
const h = require('./helpers');

test.describe('home page link', () => {
  test('the teacher kit on the home page links to the pilot demo and the link opens it', async ({ page, baseURL }) => {
    const blocked = await h.isolate(page, baseURL);
    await h.stubAudio(page);
    await page.goto('/index.html');

    // The teacher report (where the pilot kit lives) is behind the adult gate: answer and hold 3 s.
    await page.locator('#tab-teacherReport').click();
    await expect(page.locator('#adultGate')).toBeVisible();
    const q = await page.locator('#adultGateQ').textContent();
    const m = q.match(/(\d+)\s*×\s*(\d+)/);
    expect(m, 'adult question: ' + q).not.toBeNull();
    await page.locator('#adultGateAnswer').fill(String(Number(m[1]) * Number(m[2])));
    await page.locator('#adultGateOk').hover();
    await page.mouse.down();
    await page.waitForTimeout(3200);
    await page.mouse.up();
    await expect(page.locator('#teacherReport')).toBeVisible();

    const link = page.locator('#trialKit a[href="pilot/index.html"]');
    await expect(link).toHaveText('הדגמת פיילוט למורים');
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/pilot\/index\.html$/);
    await expect(page.locator('html')).toHaveAttribute('data-ready', '1');
    await expect(page.getByTestId('view-login')).toBeVisible();
    expect(blocked).toEqual([]);
  });
});

test.describe('offline after the first visit', () => {
  test.use({ serviceWorkers: 'allow' });

  test('the pilot loads and works with the network off after one online visit', async ({ page, context, baseURL }) => {
    const blocked = await h.openDemo(page, baseURL);

    // First (online) visit: the service worker installs, precaches and takes control.
    await expect.poll(() => page.evaluate(async () => {
      if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return 'no controller';
      const keys = ['pilot/index.html', 'pilot/pilot.css', 'pilot/js/app.js', 'pilot/js/store.js',
        'pilot/js/unit.js', 'pilot/seed/demo-accounts.js', 'src/lib/musicEngine.js'];
      for (const k of keys) if (!(await caches.match(new URL('/' + k, location.origin).href))) return 'missing ' + k;
      return 'ready';
    }), { timeout: 20000 }).toBe('ready');
    expect(blocked).toEqual([]);

    await context.setOffline(true);
    try {
      // Really offline: a file that is not precached does not load.
      const uncached = await page.evaluate(() => fetch('/pilot/package.json').then((r) => r.status, () => 'failed'));
      expect(uncached).toBe('failed');

      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-ready', '1');
      await expect(page.getByTestId('view-login')).toBeVisible();
      await h.signIn(page, 'student');
      await page.getByTestId('open-unit').click();
      await page.getByTestId('lesson-continue').click();
      await h.expectQuestion(page, 'q1');
      await h.answer(page, 7);
      await expect(page.getByTestId('feedback')).toHaveAttribute('data-result', 'right');
      await h.expectMobileFriendly(page);
    } finally {
      await context.setOffline(false);
    }
  });
});
