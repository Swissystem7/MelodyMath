const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'offer.html'), 'utf8');

test('offer.html has valid document semantics, RTL Hebrew, and skip link', () => {
  assert.match(page, /<html\s+lang="he"\s+dir="rtl">/);
  assert.match(page, /<a\s+class="mm-skip"\s+href="#main">דלגו לתוכן<\/a>/);
  assert.match(page, /<main[^>]*id="main"[^>]*tabindex="-1"/);
});

test('offer.html controls meet touch target and disabled styling criteria', () => {
  assert.match(page, /button,\.btn\{[^}]*min-height:44px;min-width:44px/);
  assert.match(page, /input,select\{[^}]*min-height:44px/);
  assert.match(page, /button:disabled,\.btn:disabled\{opacity:\.5;cursor:not-allowed\}/);
  assert.match(page, /\.primary:hover:not\(:disabled\)/);
});

test('offer.html focus visible outlines are defined for all interactive controls', () => {
  assert.match(page, /a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible/);
  assert.match(page, /#letterPreview:focus-visible/);
  assert.match(page, /footer a:focus-visible/);
});

test('offer.html associates labels with input elements via nesting', () => {
  assert.match(page, /<label>שם המורה\s*<input id="teacher"/);
  assert.match(page, /<label>תפקיד\s*<select id="role"/);
  assert.match(page, /<label>שם בית הספר\s*<input id="school"/);
  assert.match(page, /<label>שכבה או כיתה\s*<input id="grade"/);
  assert.match(page, /<label>גודל הקבוצה \(1–12\)\s*<input id="groupSize"/);
  assert.match(page, /<label>שם המנהל\/ת \(רשות\)\s*<input id="principal"/);
  assert.match(page, /<label>דוא״ל המנהל\/ת \(רשות — ליעד המכתב\)\s*<input id="principalEmail"/);
  assert.match(page, /<label>דוא״ל לחזרה \(רשות\)\s*<input id="replyEmail"/);
  assert.match(page, /<label class="check" id="copyProjectRow">\s*<input type="checkbox" id="copyProject"/);
});

test('offer.html letter preview has region role, label, polite live updates and keyboard tabindex', () => {
  assert.match(page, /id="letterPreview"[^>]*tabindex="0"/);
  assert.match(page, /id="letterPreview"[^>]*role="region"/);
  assert.match(page, /id="letterPreview"[^>]*aria-label="תצוגה מקדימה של המכתב"/);
  assert.match(page, /id="letterPreview"[^>]*aria-live="polite"/);
});

test('offer.html manages focus upon form submission for missing inputs and success', () => {
  assert.match(page, /if\s*\(mail\.ok\)\s*\{[\s\S]*if\s*\(\$\('openMail'\)\)\s*\$\('openMail'\)\.focus\(\);/);
  assert.match(page, /if\s*\(mail\.missing\s*&&\s*mail\.missing\.length\s*>\s*0\)\s*\{[\s\S]*firstMissing\.focus\(\);/);
});

test('offer.html footer provides reciprocal navigation across modules', () => {
  assert.match(page, /<footer>[\s\S]*href="\.\/"[\s\S]*תרגול יסודי[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="curriculum\.html"[\s\S]*כיסוי תוכנית[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="functions\.html"[\s\S]*שומעים פונקציה[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="807\.html"[\s\S]*שאלון 807[\s\S]*<\/footer>/);
  assert.match(page, /<footer>[\s\S]*href="landing\.html"[\s\S]*אודות[\s\S]*<\/footer>/);
});

test('offer.html adheres strictly to honesty constraints', () => {
  assert.doesNotMatch(page, /סוגרים פערים במתמטיקה/);
  assert.doesNotMatch(page, /מחקרים מוכיחים שהקצב/);
  assert.doesNotMatch(page, /הילד שולט בכל המיומנויות/);
  assert.doesNotMatch(page, /ADHD|דיסקלקול|dyscalcul/i);
  assert.doesNotMatch(page, /15–20%|15-20%/);
  assert.doesNotMatch(page, /checkout|stripe|paypal|תשלום עכשיו/i);
});
