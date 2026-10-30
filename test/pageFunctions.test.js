const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'functions.html'), 'utf8');

test('functions.html has valid document semantics, RTL Hebrew, and skip link', () => {
  assert.match(page, /<html\s+lang="he"\s+dir="rtl">/);
  assert.match(page, /<a\s+class="mm-skip"\s+href="#main">דלגו לתוכן<\/a>/);
  assert.match(page, /<main[^>]*id="main"[^>]*tabindex="-1"/);
});

test('functions.html controls meet touch target and focus criteria', () => {
  assert.match(page, /button\{[^}]*min-height:48px/);
  assert.match(page, /select\{[^}]*min-height:48px/);
  assert.match(page, /button:focus-visible\{outline:3px solid #a5b4fc;outline-offset:2px\}/);
  assert.match(page, /footer a:focus-visible/);
});

test('functions.html supports visual pressed state for toggle buttons and ghost buttons', () => {
  assert.match(page, /button\[aria-pressed="true"\],button\.ghost\[aria-pressed="true"\]/);
});

test('functions.html enforces RTL layout on Hebrew lesson options while preserving LTR for formula options', () => {
  assert.match(page, /\.opts button\{direction:ltr;font-weight:600\}/);
  assert.match(page, /#lessonOpts button\{direction:rtl;text-align:center\}/);
});

test('functions.html feedback elements provide role status and polite live updates', () => {
  assert.match(page, /id="lessonFb"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(page, /id="gFb"[^>]*role="status"[^>]*aria-live="polite"/);
});

test('functions.html footer provides reciprocal navigation links', () => {
  assert.match(page, /<footer>[\s\S]*href="index\.html"[\s\S]*חזרה לתרגול[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="807\.html"[\s\S]*גדילה ודעיכה \(807\)[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="landing\.html"[\s\S]*אודות[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*מוצר סוניפיקציה · חט״ב ותיכון · MelodyMath[\s\S]*<\/footer>/);
});

test('functions.html adheres to honesty constraints and carries no medical or efficacy claims', () => {
  assert.doesNotMatch(page, /סוגרים פערים במתמטיקה/);
  assert.doesNotMatch(page, /מחקרים מוכיחים/);
  assert.doesNotMatch(page, /הילד שולט בכל המיומנויות/);
  assert.doesNotMatch(page, /ADHD|דיסקלקול|dyscalcul/i);
  assert.doesNotMatch(page, /טיפול ב|משפר מתמטיקה/);
  assert.match(page, /מוצר סוניפיקציה לחטיבה ולתיכון — לא חלק מתרגול א׳–ו׳/);
});

test('functions.html advances focus after game guess and guided lesson selection', () => {
  assert.match(page, /if\(right\)\{[\s\S]*if\(\$\("gNew"\)\)\s*\$\("gNew"\)\.focus\(\);/);
  assert.match(page, /else\s*\{[\s\S]*if\(\$\("gCompare"\)\)\s*\$\("gCompare"\)\.focus\(\);/);
  assert.match(page, /if\(right\s*&&\s*\$\("lessonNext"\)\)\s*\$\("lessonNext"\)\.focus\(\);/);
});
