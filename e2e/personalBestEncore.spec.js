// #591 PersonalBestEncore in the real page: a ?topic= link (program.html) opens
// one topic step; the child finishes it better than their own saved best and
// hears the encore on their instrument with two other families. With "בלי מוזיקה"
// the same new best shows the words and plays nothing.
const { test, expect } = require('@playwright/test');

async function openTopic(page, quiet) {
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
  return pick;
}

async function solveStep(page) {
  for (let i = 0; i < 6; i++) {
    const answer = await page.evaluate('String(rmPlan[rpStep].current.answer)');
    // Some items ask for a prediction first (predict.js); the answer box opens after it.
    if (await page.locator('#rmPlanAnswer').isDisabled()) await page.locator('#rmPlanPredict .choices button').first().click();
    await page.locator('#rmPlanAnswer').fill(answer);
    await page.locator('#rmPlanCheck').click();
    await expect(page.locator('#rmPlanFeedback')).toHaveClass(/good/);
    await page.locator('#rmPlanNext').click();
  }
}

test('a new personal best at the end of the topic plays the encore on the child\'s instrument', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const pick = await openTopic(page, false);
  await solveStep(page);
  await expect(page.locator('#rmReward [data-encore]')).toContainText('הדרן');
  await expect(page.locator('#rmReward [data-encore]')).toContainText('שיא חדש שלך');
  await expect(page.locator('#rmReward [data-encore]')).not.toContainText('חכם');
  // The streak reward for 5 in a row also plays (instrument null: the phrase's own); only the encore names instruments.
  const played = (await page.evaluate(() => window.__played)).filter(Boolean);
  expect(played).toContain('djembe');
  const fams = await page.evaluate((ids) => [...new Set(ids.map((id) => instrumentById(id).family))], played);
  expect(fams.length).toBeGreaterThanOrEqual(3);
  const best = await page.evaluate((k) => JSON.parse(localStorage.getItem('mm.personalBest.v1')).me[k], 'ג:' + pick.skill);
  expect(best.acc).toBe(1);
  expect(errors).toEqual([]);
});

test('no-music check: with "בלי מוזיקה" the new best shows the words and plays nothing', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await openTopic(page, true);
  await solveStep(page);
  await expect(page.locator('#rmReward [data-encore]')).toContainText('הדרן');
  expect(await page.evaluate(() => window.__played)).toEqual([]);
  expect(errors).toEqual([]);
});
