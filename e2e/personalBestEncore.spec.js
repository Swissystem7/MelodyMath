// #591: a ?topic= step that beats this child's own best plays one reward, the encore.
const { test, expect } = require('@playwright/test');

async function finishTopic(page, quiet) {
  await page.goto('/index.html');
  const pick = await page.evaluate(() => {
    const r = programForGrade('ג', itemsForGrade('ג')).rows.find((x) => x.skills && x.skills.length);
    return { topicId: r.topicId, skill: r.skills[0].skill };
  });
  await page.evaluate(({ skill, quiet }) => {
    localStorage.setItem('mm.myInstrument', 'djembe');
    localStorage.setItem('mm.personalBest.v1', JSON.stringify({ me: { ['ג:' + skill]: { acc: 0.5, h: 0 } } }));
    if (quiet) localStorage.setItem('mm-access-v1', JSON.stringify({ quiet: true }));
  }, { skill: pick.skill, quiet });
  await page.goto('/index.html?topic=' + encodeURIComponent(pick.topicId) + '&skill=' + encodeURIComponent(pick.skill));
  await expect(page.locator('#rmPlan')).toBeVisible();
  await page.evaluate(() => {
    const S = window.MM_MASTERY_STREAK, orig = S.playPhrase;
    window.__played = [];
    S.playPhrase = (p, inst, ac, d) => { window.__played.push(inst); return orig(p, inst, ac, d); };
  });
  for (let i = 0; i < 6; i++) {
    const answer = await page.evaluate('String(rmPlan[rpStep].current.answer)');
    if (await page.locator('#rmPlanAnswer').isDisabled()) await page.locator('#rmPlanPredict .choices button').first().click();
    await page.locator('#rmPlanAnswer').fill(answer);
    await page.locator('#rmPlanCheck').click();
    await expect(page.locator('#rmPlanFeedback')).toHaveClass(/good/);
    await page.locator('#rmPlanNext').click();
  }
  return pick;
}

test('a new best plays the encore only, on the child instrument, not the streak phrase', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const pick = await finishTopic(page, false);
  const encore = page.locator('#rmReward [data-encore]');
  await expect(encore).toContainText('הדרן');
  await expect(encore).toContainText('שיא חדש שלך');
  await expect(encore).not.toContainText('חכם');
  const played = await page.evaluate(() => window.__played);
  expect(played.every(Boolean)).toBe(true);
  expect(played).toContain('djembe');
  const fams = await page.evaluate((ids) => [...new Set(ids.map((id) => instrumentById(id).family))], played);
  expect(fams.length).toBeGreaterThanOrEqual(3);
  const best = await page.evaluate((k) => JSON.parse(localStorage.getItem('mm.personalBest.v1')).me[k], 'ג:' + pick.skill);
  expect(best.acc).toBe(1);
  expect(errors).toEqual([]);
});

test('"בלי מוזיקה": the words show and nothing plays', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await finishTopic(page, true);
  await expect(page.locator('#rmReward [data-encore]')).toContainText('הדרן');
  expect(await page.evaluate(() => window.__played)).toEqual([]);
  expect(errors).toEqual([]);
});
