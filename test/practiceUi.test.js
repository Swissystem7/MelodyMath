const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('practice quiz provides a cancel action to exit cleanly back to start', () => {
  assert.match(indexHtml, /id="quizCancel"[^>]*class="secondary no-print"[^>]*>ביטול וחזרה<\/button>/);
  assert.match(indexHtml, /\$\('quizCancel'\)\.onclick=\(\)=>\{endTeacherSession\(\);history=\[\];current=null;show\('quiz',false\);show\('start',true\);if\(\$\('begin'\)&&typeof \$\('begin'\)\.focus==='function'\)\$\('begin'\)\.focus\(\)\}/);
});

test('practice levels container provides WAI-ARIA group semantics', () => {
  assert.match(indexHtml, /class="levels"[^>]*role="group"[^>]*aria-label="רמת קושי לתרגול"/);
});

test('practice counter provides accessible live region semantics for screen readers', () => {
  assert.match(indexHtml, /id="counter"[^>]*role="status"[^>]*aria-live="polite"/);
});

test('practice check advances focus to next or finish button upon answer verification', () => {
  assert.match(indexHtml, /function check\(\)[\s\S]*?if\(history\.length<10\)\{if\(\$\('next'\)&&typeof \$\('next'\)\.focus==='function'\)\$\('next'\)\.focus\(\)\}else\{if\(\$\('finish'\)&&typeof \$\('finish'\)\.focus==='function'\)\$\('finish'\)\.focus\(\)/);
});

test('practice finish and again advance focus seamlessly without dead-end states', () => {
  assert.match(indexHtml, /function finish\(\)[\s\S]*?if\(\$\('again'\)&&typeof \$\('again'\)\.focus==='function'\)\$\('again'\)\.focus\(\)/);
  assert.match(indexHtml, /\$\('again'\)\.onclick=\(\)=>\{show\('summary',false\);show\('start',true\);if\(\$\('begin'\)&&typeof \$\('begin'\)\.focus==='function'\)\$\('begin'\)\.focus\(\)\}/);
});

test('practice answer input advances on Enter key when already checked', () => {
  assert.match(indexHtml, /\$\('answer'\)\.onkeydown=e=>\{if\(e\.key==='Enter'\)\{if\(!answered\)check\(\);else if\(\$\('next'\)&&!\$\('next'\)\.classList\.contains\('hidden'\)\)renderExercise\(\);else if\(\$\('finish'\)&&!\$\('finish'\)\.classList\.contains\('hidden'\)\)finish\(\)\}\}/);
});

test('practice mode complies with honesty guidelines (no clinical or cure claims)', () => {
  assert.match(indexHtml, /לא ציון ולא הוכחה שהתרגול עוזר/);
  assert.doesNotMatch(indexHtml, /ריפוי דיסקלקוליה|הבטחה להצלחה|שיפור קליני מוכח/);
});
