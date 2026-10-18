const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('rmQuiz provides a cancel action to exit cleanly back to rmStart', () => {
  assert.match(indexHtml, /id="rmCancel"[^>]*class="secondary no-print"[^>]*>ביטול וחזרה<\/button>/);
  assert.match(indexHtml, /\$\('rmCancel'\)\.onclick=\(\)=>\{endTeacherSession\(\);show\('rmQuiz',false\);show\('rmStart',true\);if\(\$\('rmBegin'\)\)\$\('rmBegin'\)\.focus\(\)\}/);
});

test('rmReward provides accessible live region semantics for musical feedback', () => {
  assert.match(indexHtml, /id="rmReward"[^>]*role="status"[^>]*aria-live="polite"/);
});

test('rmPlan provides completion action buttons for a11y and seamless user navigation', () => {
  assert.match(indexHtml, /id="rmPlanDoneActions"[^>]*class="hidden"/);
  assert.match(indexHtml, /id="rmPlanRestart"[^>]*class="primary"[^>]*>אבחון חדש<\/button>/);
  assert.match(indexHtml, /id="rmPlanReport"[^>]*class="secondary"[^>]*>חזרה לדוח הפערים<\/button>/);
});

test('rpAdvance activates rmPlanDoneActions and directs focus to rmPlanRestart on plan completion', () => {
  assert.match(indexHtml, /show\('rmPlanDoneActions',true\);/);
  assert.match(indexHtml, /if\(\$\('rmPlanRestart'\)\)\$\('rmPlanRestart'\)\.focus\(\)/);
});

test('rmPlanRestart and rmPlanReport return to rmStart and rmReport respectively with proper focus', () => {
  assert.match(indexHtml, /\$\('rmPlanRestart'\)\.onclick=\(\)=>\{show\('rmPlan',false\);show\('rmPlanDoneActions',false\);show\('rmStart',true\);if\(\$\('rmBegin'\)\)\$\('rmBegin'\)\.focus\(\)\}/);
  assert.match(indexHtml, /\$\('rmPlanReport'\)\.onclick=\(\)=>\{show\('rmPlan',false\);show\('rmPlanDoneActions',false\);show\('rmReport',true\);if\(\$\('rmPractice'\)\)\$\('rmPractice'\)\.focus\(\)\}/);
});

test('remediation start and practice triggers hide stale rmPlanDoneActions', () => {
  assert.match(indexHtml, /\$\('rmBegin'\)\.onclick=[\s\S]*?show\('rmPlanDoneActions',false\)/);
  assert.match(indexHtml, /\$\('rmPractice'\)\.onclick=[\s\S]*?show\('rmPlanDoneActions',false\)/);
  assert.match(indexHtml, /\$\('rmRestart'\)\.onclick=[\s\S]*?show\('rmPlanDoneActions',false\)/);
});

test('remediation actions comply with honesty guidelines (no cure, no clinical claim)', () => {
  assert.match(indexHtml, /לא אבחון קליני/);
  assert.doesNotMatch(indexHtml, /טיפול רפואי|סגירת פערים מובטחת|מרפא דיסקלקוליה/);
});
