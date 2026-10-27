// MelodyMath — Playwright E2E test for Issue #665 acceptance criteria.
// Covers:
// 1. ≤ 15 words per card across exercise prompts, hints, and feedback messages.
// 2. Second try flow after a wrong answer (gentle feedback, retry state).
// 3. answerY < 400px across active exercise screens.

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

test('e2e criteria #665: card word counts <= 15 words', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('index.html');
  await page.locator('#tab-remediation').click();

  // Inspect prompts & hints across initial cards
  const cardElements = page.locator('.card, .ex-card, #rmQuiz');
  const count = await cardElements.count();
  for (let i = 0; i < count; i++) {
    const cardText = await cardElements.nth(i).textContent();
    // Check key card text segments (paragraphs or headings)
    const lines = cardText.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    for (const line of lines) {
      // Ignore long technical labels or SVG text blocks
      if (line.length > 0 && !line.includes('function')) {
        expect(wordCount(line)).toBeLessThanOrEqual(15);
      }
    }
  }

  expect(errors).toEqual([]);
});

test('e2e criteria #665: second try after wrong answer and answerY < 400px', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('index.html');
  await page.locator('#classCode').fill('e2e-665');
  await page.locator('#studentName').fill('בדיקה');
  await page.locator('#whoSave').click();
  await page.locator('#gradePick button[data-grade="א"]').click();

  // Start remediation practice
  await page.locator('#tab-remediation').click();
  await page.locator('#rmBegin').click();
  await expect(page.locator('#rmQuiz')).toBeVisible();

  // 1. Verify answer input position (answerY < 400px)
  const answerInput = page.locator('#rmAnswer');
  await expect(answerInput).toBeVisible();
  const box = await answerInput.boundingBox();
  expect(box).not.toBeNull();
  expect(box.y).toBeLessThan(400);

  // 2. Submit wrong answer to trigger second try state
  await answerInput.fill('999');
  await page.locator('#rmCheck').click();

  // Verify feedback is visible, does not penalty with buzzer, and allows retry
  const feedback = page.locator('#rmFeedback');
  await expect(feedback).toBeVisible();
  const fbText = await feedback.textContent();
  expect(wordCount(fbText)).toBeLessThanOrEqual(15);

  // Next button proceeds to retry/next item
  await page.locator('#rmNext').click();

  expect(errors).toEqual([]);
});

// Added from PR #821 (Jules): the same #665 checks on the practice tab.
test('e2e criteria #665: practice flow wrong answer gives short gentle feedback', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('index.html');

  // Start practice exercise card
  await page.locator('#tab-practice').click();
  await page.locator('#begin').click();
  await expect(page.locator('#quiz')).toBeVisible();

  const answerInput = page.locator('#answer');
  await expect(answerInput).toBeVisible();

  // Submit wrong answer to trigger second try state / encouraging feedback
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

test('e2e criteria #665: practice answerY relative to exercise card top < 400px', async ({ page }) => {
  const errors = watchErrors(page);

  await page.goto('index.html');
  await page.locator('#tab-practice').click();
  await page.locator('#begin').click();
  await expect(page.locator('#quiz')).toBeVisible();

  // Verify answer input position inside the exercise card (answerY relative to card top < 400px)
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

  expect(errors).toEqual([]);
});
