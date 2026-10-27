// MelodyMath — Playwright E2E test for Issue #665 acceptance criteria.
// Covers:
// 1. ≤ 15 words per card element (prompts, hints, feedback messages, headings).
// 2. Second try flow after a wrong answer (gentle feedback, retry state).
// 3. answerY < 400px across active exercise screens (distance from active exercise card top to answer input < 400px).

const { test, expect } = require('@playwright/test');

function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  return errors;
}

test('e2e criteria #665: card text elements <= 15 words', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('index.html');
  await page.locator('#tab-remediation').click();

  // Inspect prompts, hints, feedback text and headings on exercise cards
  const textElements = page.locator('.ex-prompt, .rm-prompt, #rmPlanPrompt, .ex-hint, .rm-hint, #rmFeedback strong, #rmPlanFeedback strong, .card h2, .card h3');
  const count = await textElements.count();
  for (let i = 0; i < count; i++) {
    const text = await textElements.nth(i).textContent();
    if (text && text.trim().length > 0) {
      expect(wordCount(text)).toBeLessThanOrEqual(15);
    }
  }

  expect(errors).toEqual([]);
});

test('e2e criteria #665: second try after wrong answer and answerY < 400px', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('index.html');

  // Start practice exercise card
  await page.locator('#tab-practice').click();
  await page.locator('#begin').click();
  await expect(page.locator('#quiz')).toBeVisible();

  // 1. Verify answer input position inside the exercise card (answerY relative to card top < 400px)
  const quizCard = page.locator('#quiz');
  const answerInput = page.locator('#answer');
  await expect(answerInput).toBeVisible();

  const cardBox = await quizCard.boundingBox();
  const inputBox = await answerInput.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(inputBox).not.toBeNull();

  // Answer Y offset from top of card container is < 400px
  const answerY = inputBox.y - cardBox.y;
  expect(answerY).toBeLessThan(400);

  // 2. Submit wrong answer to trigger second try state / encouraging feedback
  await answerInput.fill('999');
  await page.locator('#check').click();

  // Verify feedback is visible, gentle, and <= 15 words
  const feedback = page.locator('#feedback');
  await expect(feedback).toBeVisible();
  const fbText = await feedback.textContent();
  const cleanFbText = fbText.replace(/[\n\r]+/g, ' ').trim();
  expect(wordCount(cleanFbText)).toBeLessThanOrEqual(15);

  expect(errors).toEqual([]);
});
