// #591 MusicianshipPath: offered at the end of a maths session, skippable,
// four skills, progress saved under its own key only, no buy/price words.
// Run by hand like the rest of e2e/ (see playwright.config.js):
//   npx --yes playwright@1.49 test --config e2e/playwright.config.js e2e/musicianshipPath.spec.js
const { test, expect } = require('@playwright/test');

test('after a beat-mode session the offer opens the path; the whole path saves only mm.musicianship.progress', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html');
  await page.waitForFunction(() => window.MM_MUSICIANSHIP_PATH && window.MM_MUSICIANSHIP_PATH.handle);
  const keysBefore = await page.evaluate(() => Object.keys(localStorage).sort());

  // The end-of-session card of beat mode carries the offer.
  await page.locator('#tab-beatMode').click();
  await page.evaluate(() => { document.getElementById('beatGate').classList.add('hidden'); document.getElementById('beatDone').classList.remove('hidden'); });
  await page.locator('#beatDone [data-msp-offer]').click();
  await expect(page.locator('#tab-musicGames')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#mspCard [data-act="skip"]')).toBeVisible();

  await page.locator('#mspCard [data-act="start"]').click();
  const skills = new Set();
  for (let i = 0; i < 8; i++) {
    const it = await page.evaluate(() => { const s = window.MM_MUSICIANSHIP_PATH.handle.state; return s.items[s.i]; });
    skills.add(it.skill);
    await page.locator('#mspCard [data-act="play"]').click();
    if (it.skill === 'pitch') {
      await page.locator('#mspCard [data-key="' + it.target + '"]').click();
      await page.locator('#mspCard [data-act="check"]').click();
    } else {
      await page.locator('#mspCard [data-opt="' + it.answer + '"]').click();
    }
    await page.locator('#mspCard [data-act="next"]').click();
  }
  expect([...skills].sort()).toEqual(['families', 'pitch', 'rhythm', 'timbre']);
  await expect(page.locator('#mspCard')).toContainText('סיימתם את מסלול המוזיקליות');

  const keysAfter = await page.evaluate(() => Object.keys(localStorage).sort());
  const added = keysAfter.filter((k) => keysBefore.indexOf(k) === -1);
  expect(added).toEqual(['mm.musicianship.progress']);
  const text = await page.locator('#mspCard').innerText();
  expect(text).not.toMatch(/(^|[^א-ת])(קנה|מחיר|רכישה|מנוי)([^א-ת]|$)/);
  expect(errors).toEqual([]);
});
