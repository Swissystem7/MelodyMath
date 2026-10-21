const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'check.html'), 'utf8');

test('check.html has valid document semantics, RTL Hebrew, and skip link', () => {
  assert.match(page, /<html\s+lang="he"\s+dir="rtl">/);
  assert.match(page, /<a\s+class="mm-skip"\s+href="#main">דלגו לתוכן<\/a>/);
  assert.match(page, /<main[^>]*id="main"[^>]*tabindex="-1"/);
});

test('check.html controls meet touch target, focus and hover criteria', () => {
  assert.match(page, /input,select\{[^}]*min-height:44px/);
  assert.match(page, /button\{[^}]*min-height:44px/);
  assert.match(page, /\.choices button:hover\{[^}]*background:/);
  assert.match(page, /\.choices button:active\{[^}]*background:/);
  assert.match(page, /footer a:focus-visible/);
  assert.match(page, /:focus-visible\{[^}]*outline:/);
});

test('check.html labels each answer choice and guards the first-choice focus', () => {
  assert.match(page, /aria-label="תשובה ' \+ \(idx \+ 1\) \+ ': '/);
  assert.match(page, /const firstChoice = \$\('quizChoices'\)\.querySelector\('button'\);\s*if \(firstChoice\) firstChoice\.focus\(\);/);
});

test('check.html report table uses row headers and points back to the report title', () => {
  assert.match(page, /<th scope="row">/);
  assert.match(page, /<table aria-describedby="reportTitle">/);
  assert.match(page, /id="reportEmpty"/);
});

test('check.html footer provides reciprocal navigation links', () => {
  assert.match(page, /<footer>[\s\S]*href="index\.html"[\s\S]*חזרה לתרגול[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="curriculum\.html"[\s\S]*תוכנית לימודים[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="landing\.html"[\s\S]*אודות[\s\S]*<\/footer>/);
});

test('check.html adheres to honesty constraints and carries no medical or efficacy claims', () => {
  assert.doesNotMatch(page, /סוגרים פערים במתמטיקה/);
  assert.doesNotMatch(page, /מחקרים מוכיחים/);
  assert.doesNotMatch(page, /הילד שולט בכל המיומנויות/);
  assert.doesNotMatch(page, /ADHD|דיסקלקול|dyscalcul/i);
  assert.doesNotMatch(page, /טיפול ב|משפר מתמטיקה/);
  assert.match(page, /UNIT_CHECK_DISCLAIMER/);
});

test('check.html sends focus to the name field when it is missing and renders the report on load', () => {
  assert.match(page, /'צריך שם או קוד תלמיד\/ה\.';\s*\$\('studentName'\)\.focus\(\);\s*return;/);
  assert.match(page, /renderReport\(\);\s*\}\)\(\);/);
});
