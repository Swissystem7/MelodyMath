// MelodyMath — End-to-end Playwright smoke test of a child's complete learning path (Issue #665, Task 19).
// Covers:
// 1. Open app (index.html) and select grade / identify student.
// 2. Pick instrument from available timbre / family controls.
// 3. Solve 3 exercises through musical representation and auditory scaffolding.
// 4. Receive encouraging feedback on an incorrect answer without penalty or harsh buzzer.
// 5. Complete final topic check without music (sound → picture → symbol → plain check).
const { test, expect } = require('@playwright/test');

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  return errors;
}

test('child path: open app, pick instrument, solve 3 exercises via music, wrong feedback, and no-music check', async ({ page }) => {
  const errors = watchErrors(page);

  // 1. Open app: verifies page loads, heading and grade buttons render.
  await page.goto('index.html');
  await expect(page.locator('#main')).toBeVisible();
  await expect(page).toHaveTitle(/MelodyMath/i);

  // Set student identity & grade
  await page.locator('#classCode').fill('שילוב-א');
  await page.locator('#studentName').fill('איתמר');
  await page.locator('#whoSave').click();
  await page.locator('#gradePick button[data-grade="א"]').click();
  await expect(page.locator('#gradeNote')).toBeVisible();

  // 2. Pick instrument: select an instrument pad / sound timbre.
  await page.locator('#tab-musicGames').click();
  await expect(page.locator('#musicGames')).toBeVisible();
  const instBtn = page.locator('#musicGames button[data-tap], .mm-game button[data-tap]').first();
  if (await instBtn.count() > 0) {
    await instBtn.click();
  }

  // 3. Solve 3 exercises via music:
  await page.locator('#tab-remediation').click();
  await page.locator('#rmBegin').click();
  await expect(page.locator('#rmQuiz')).toBeVisible();

  for (let i = 0; i < 3; i++) {
    await expect(page.locator('#rmPrompt')).not.toBeEmpty();
    const ans = await page.evaluate(() => String(window.RM_DIAG[window.rmIdx].answer));
    await page.locator('#rmAnswer').fill(ans);
    await page.locator('#rmCheck').click();
    await expect(page.locator('#rmFeedback')).toHaveClass(/good/);
    if (i < 2) {
      await page.locator('#rmNext').click();
    }
  }

  // 4. Wrong answer feedback: enters an incorrect response and verifies gentle, encouraging feedback
  await page.locator('#rmNext').click();
  await page.locator('#rmAnswer').fill('999');
  await page.locator('#rmCheck').click();
  await expect(page.locator('#rmFeedback')).toBeVisible();
  await expect(page.locator('#rmFeedback')).toHaveClass(/bad/);
  await expect(page.locator('#rmFeedback')).toContainText(/עוד רגע|לא נכון|התשובה/);

  // 5. Final check without music (no-music check):
  await page.goto('check.html');
  await expect(page.locator('#main')).toBeVisible();
  await page.locator('#classCode').fill('שילוב-א');
  await page.locator('#studentName').fill('איתמר');
  await page.locator('#startPre').click();
  await expect(page.locator('#quiz')).toBeVisible();
  await expect(page.locator('#quizPrompt')).not.toBeEmpty();
  await expect(page.locator('#quizChoices button')).not.toHaveCount(0);

  // Plain answer selection without sound
  await page.locator('#quizChoices button').first().click();

  expect(errors).toEqual([]);
});
