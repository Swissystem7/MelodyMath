const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('guided lessons grade filter provides accessible group role, label, and aria-pressed state', () => {
  assert.match(indexHtml, /id="lessonsGradeFilter"[^>]*role="group"/);
  assert.match(indexHtml, /id="lessonsGradeFilter"[^>]*aria-label="סינון שיעורים לפי כיתה"/);
  assert.match(indexHtml, /box\.setAttribute\('role',\s*'group'\)/);
  assert.match(indexHtml, /box\.setAttribute\('aria-label',\s*'סינון שיעורים לפי כיתה'\)/);
  assert.match(indexHtml, /data-lesson-filter="\$\{f\.id\}"\s+aria-pressed="\$\{on\}"/);
});

test('guided lessons grid displays an informative empty state when no lessons match the filter', () => {
  assert.match(indexHtml, /if\s*\(!list\.length\)\s*\{/);
  assert.match(indexHtml, /אין עדיין שיעורים מודרכים לכיתה זו/);
  assert.match(indexHtml, /role="status"/);
});

test('guided lessons stepper provides navigation semantics and indicates active step', () => {
  assert.match(indexHtml, /id="lessonStepper"[^>]*role="navigation"/);
  assert.match(indexHtml, /id="lessonStepper"[^>]*aria-label="שלבי השיעור"/);
  assert.match(indexHtml, /stepper\.setAttribute\('role',\s*'navigation'\)/);
  assert.match(indexHtml, /stepper\.setAttribute\('aria-label',\s*'שלבי השיעור'\)/);
  assert.match(indexHtml, /aria-current="\$\{idx === activeStepIndex \? 'step' : 'false'\}"/);
});

test('guided lesson quiz choices provide group semantics and retry action for incorrect answers', () => {
  assert.match(indexHtml, /id="stepQuizChoices"[^>]*role="group"/);
  assert.match(indexHtml, /id="stepQuizChoices"[^>]*aria-label="אפשרויות תשובה"/);
  assert.match(indexHtml, /choicesBox\.setAttribute\('role',\s*'group'\)/);
  assert.match(indexHtml, /choicesBox\.setAttribute\('aria-label',\s*'אפשרויות תשובה'\)/);
  assert.match(indexHtml, /id="stepQuizRetryBtn"/);
  assert.match(indexHtml, /🔄 נסו שוב/);
});

test('guided lesson quiz advances focus on correct answer and focuses retry button on incorrect answer', () => {
  assert.match(indexHtml, /if\s*\(res\.correct\)\s*\{[\s\S]*nextActionBtn\.focus\(\);/);
  assert.match(indexHtml, /retryBtn\.focus\(\);/);
  assert.match(indexHtml, /firstChoice\.focus\(\);/);
});

test('lesson card is not a role=button wrapping its own clickable start button', () => {
  assert.doesNotMatch(indexHtml, /class="lesson-card"[^>]*role="button"/);
  assert.doesNotMatch(indexHtml, /pointer-events:none;">התחלת שיעור/);
  assert.match(indexHtml, /class="primary lesson-start"/);
});

test('the bank-practice button waits for a quiz answer and the retry cue is a prominent primary button', () => {
  assert.match(indexHtml, /\$\('stepPracticeBtn'\)\.disabled = isLast && Array\.isArray\(step\.options\);/);
  assert.match(indexHtml, /\$\('stepPracticeBtn'\)\.disabled = false;/);
  assert.match(indexHtml, /id="stepQuizRetryBtn" class="primary"/);
  assert.match(indexHtml, /לחצו «נסו שוב» כדי לבחור תשובה חדשה/);
});

test('the diagnostic counter is an isolated LTR integer N/total within the round (#678)', () => {
  assert.match(indexHtml, /שאלה <bdi dir="ltr"[^>]*>\$\{ri\+1\}\/\$\{rn\}<\/bdi>/);
});

test('opening and closing a lesson manages keyboard focus properly', () => {
  assert.match(indexHtml, /const closeBtn = \$\('lessonCloseBtn'\);\s*\n\s*if\s*\(closeBtn\)\s*closeBtn\.focus\(\);/);
  assert.match(indexHtml, /const prevLessonId = activeLessonId;/);
  assert.match(indexHtml, /prevCard\.focus\(\);/);
});
