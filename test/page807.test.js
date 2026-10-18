const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, '807.html'), 'utf8');

test('807.html has valid document semantics, RTL Hebrew, and skip link', () => {
  assert.match(page, /<html\s+lang="he"\s+dir="rtl">/);
  assert.match(page, /<a\s+class="mm-skip"\s+href="#main">דלגו לתוכן<\/a>/);
  assert.match(page, /<main[^>]*id="main"[^>]*tabindex="-1"/);
});

test('807.html controls and interactive elements meet touch target and focus criteria', () => {
  assert.match(page, /\.tab\{[^}]*min-height:44px/);
  assert.match(page, /input\[type=text\]\{[^}]*min-height:44px/);
  assert.match(page, /footer a:focus-visible/);
  assert.match(page, /id="ans"[^>]*aria-label="התשובה"/);
  assert.match(page, /id="feedback"[^>]*role="status"[^>]*aria-live="polite"/);
});

test('807.html footer provides reciprocal navigation links', () => {
  assert.match(page, /<footer>[\s\S]*href="index\.html"[\s\S]*חזרה לתרגול[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="functions\.html"[\s\S]*שומעים פונקציה[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="landing\.html"[\s\S]*אודות[\s\S]*<\/footer>/);
});

test('807.html adheres to honesty constraints and carries no medical or efficacy claims', () => {
  assert.doesNotMatch(page, /סוגרים פערים במתמטיקה/);
  assert.doesNotMatch(page, /מחקרים מוכיחים/);
  assert.doesNotMatch(page, /הילד שולט בכל המיומנויות/);
  assert.doesNotMatch(page, /ADHD|דיסקלקול|dyscalcul/i);
  assert.doesNotMatch(page, /טיפול ב|משפר מתמטיקה/);
  assert.match(page, /מוצר סוניפיקציה · לא תרגול א׳–ד׳ · שאלון 807/);
});

test('807.html wires keyboard submission, focus advancement, and return on next question', () => {
  assert.match(page, /if\(e\.key==='Enter'\)check\(\)/);
  assert.match(page, /const nextBtn=document\.getElementById\('nextBtn'\);[\s\S]*if\(nextBtn\)\s*nextBtn\.focus\(\);/);
  assert.match(page, /function flash\(msg\)[\s\S]*const ans=document\.getElementById\('ans'\);[\s\S]*if\(ans\)\s*ans\.focus\(\);/);
  assert.match(page, /document\.getElementById\('nextBtn'\)\.addEventListener\('click'[\s\S]*const ans=document\.getElementById\('ans'\);[\s\S]*if\(ans\)\s*ans\.focus\(\);/);
});
