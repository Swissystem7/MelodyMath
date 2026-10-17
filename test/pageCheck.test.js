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

test('check.html controls and interactive elements meet touch target, focus and hover criteria', () => {
  assert.match(page, /input,select\{[^}]*min-height:44px/);
  assert.match(page, /button\{[^}]*min-height:44px/);
  assert.match(page, /\.choices button:hover\{[^}]*background:/);
  assert.match(page, /\.choices button:active\{[^}]*background:/);
  assert.match(page, /footer a:focus-visible/);
  assert.match(page, /:focus-visible\{[^}]*outline:/);
  assert.match(page, /id="setupStatus"[^>]*role="status"[^>]*aria-live="polite"/);
});

test('check.html quiz interface supports WAI-ARIA grouping, choice labels, and cancel action', () => {
  assert.match(page, /id="quizChoices"[^>]*role="group"[^>]*aria-label="אפשרויות תשובה"/);
  assert.match(page, /id="cancelQuiz"/);
  assert.match(page, /aria-label="ביטול הבדיקה וחזרה למסך הראשי"/);
  assert.match(page, /aria-label="תשובה /);
});

test('check.html table output incorporates WAI-ARIA caption and column/row scope semantics', () => {
  assert.match(page, /<caption class="sr-only">תוצאות בדיקה לפני ואחרי יחידה לפי תלמיד\/ה<\/caption>/);
  assert.match(page, /<th scope="col">תלמיד\/ה<\/th>/);
  assert.match(page, /<th scope="row">/);
  assert.match(page, /aria-describedby="reportTitle"/);
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

test('check.html wires keyboard submission, focus restoration, and cancel behavior', () => {
  assert.match(page, /if\s*\(e\.key\s*===\s*'Enter'\)[\s\S]*start\('pre'\)/);
  assert.match(page, /function restoreSetupFocus\(\)/);
  assert.match(page, /function cancelQuiz\(\)/);
  assert.match(page, /\$\('cancelQuiz'\)\.onclick\s*=\s*cancelQuiz/);
  assert.match(page, /\$\('unit'\)\.addEventListener\('change',\s*renderReport\)/);
});
