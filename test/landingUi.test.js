const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'landing.html'), 'utf8');

test('landing.html has valid document semantics, RTL Hebrew, and skip link', () => {
  assert.match(page, /<html\s+lang="he"\s+dir="rtl">/);
  assert.match(page, /<a\s+class="mm-skip"\s+href="#main">דלגו לתוכן<\/a>/);
  assert.match(page, /<main[^>]*id="main"[^>]*tabindex="-1"/);
});

test('landing.html controls meet touch target and disabled styling criteria', () => {
  assert.match(page, /\.nav a\.cta\{[^}]*min-height:44px;min-width:44px/);
  assert.match(page, /button,\.btn\{[^}]*min-height:44px;min-width:44px/);
  assert.match(page, /button:disabled,\.btn:disabled\{opacity:\.5;cursor:not-allowed;?\}/);
  assert.match(page, /\.primary:hover:not\(:disabled\)/);
});

test('landing.html focus visible outlines are defined for all interactive controls', () => {
  assert.match(page, /a:focus-visible,\.btn:focus-visible,\.nav a\.cta:focus-visible,\.mm-skip:focus-visible/);
  assert.match(page, /footer a:focus-visible\{outline:3px solid var\(--teal\);outline-offset:2px;?\}/);
});

test('landing.html provides clear primary and secondary call-to-actions', () => {
  assert.match(page, /<a class="cta" href="\.\/">לדמו<\/a>/);
  assert.match(page, /<a class="btn primary" href="\.\/">תרגול יסודי א׳–ד׳<\/a>/);
  assert.match(page, /<a class="btn ghost" href="functions\.html">סוניפיקציה · חט״ב\/תיכון<\/a>/);
  assert.match(page, /<a class="btn ghost" href="curriculum\.html">כיסוי תוכנית<\/a>/);
  assert.match(page, /<a class="btn primary" href="offer\.html">הזמן ניסוי כיתתי<\/a>/);
});

test('landing.html links both functions and 807 in the sonification product section', () => {
  assert.match(page, /<a href="functions\.html">לגרפים<\/a> · <a href="807\.html">ל־807<\/a>/);
  assert.match(page, /<a href="functions\.html">לגרפים »<\/a> · <a href="807\.html">ל־807 »<\/a>/);
});

test('landing.html footer provides reciprocal navigation across modules', () => {
  assert.match(page, /<footer>[\s\S]*href="\.\/"[\s\S]*תרגול יסודי[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="curriculum\.html"[\s\S]*כיסוי תוכנית[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="functions\.html"[\s\S]*שומעים פונקציה[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="807\.html"[\s\S]*שאלון 807[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="offer\.html"[\s\S]*ניסוי כיתתי[\s\S]*<\/footer>/);
});

test('landing.html loads required client scripts', () => {
  assert.match(page, /<script src="src\/lib\/access\.js"><\/script>/);
  assert.match(page, /<script src="src\/lib\/contact\.js"><\/script>/);
  assert.match(page, /<script src="src\/lib\/core\.js"><\/script>/);
  assert.match(page, /data-mm-contact data-subject="MelodyMath · פנייה"/);
});

test('landing.html adheres strictly to honesty constraints', () => {
  assert.doesNotMatch(page, /סוגרים פערים במתמטיקה/);
  assert.doesNotMatch(page, /מחקרים מוכיחים שהקצב/);
  assert.doesNotMatch(page, /הילד שולט בכל המיומנויות/);
  assert.doesNotMatch(page, /ADHD|דיסקלקול|dyscalcul/i);
  assert.doesNotMatch(page, /15–20%|15-20%/);
  assert.doesNotMatch(page, /checkout|stripe|paypal|תשלום עכשיו/i);
  assert.match(page, /PARK/);
  assert.match(page, /אין מוצר בתשלום/);
});
