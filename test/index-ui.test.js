const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('home has no fake pro upgrade, streak badge, or leftover paywall chrome', () => {
  assert.doesNotMatch(indexHtml, /rmUpgradeBtn|שדרוג לפרו|rmProBadge|rmParentPro|rmStreakBadge/);
});

test('the teacher tab has a class board and a parent letter, not a paywall', () => {
  assert.match(indexHtml, /id="classBoard"/);
  assert.match(indexHtml, /id="parentLetter"/);
  assert.match(indexHtml, /מכתב קצר הביתה/);
  assert.match(indexHtml, /id="firstRun"/);
  assert.match(indexHtml, /id="beatMode"/);
  assert.match(indexHtml, /id="certCard"/);
  assert.match(indexHtml, /לא הצטיינות/);
  assert.doesNotMatch(indexHtml, /checkout|stripe|תשלום עכשיו/i);
  assert.match(indexHtml, /offer\.html/);
  assert.match(indexHtml, /חינם לתמיד/);
});

test('home is the elementary product: grade picker, coverage link, no mixed sonify hero', () => {
  assert.match(indexHtml, /id="gradePick"/);
  assert.match(indexHtml, /curriculum\.html/);
  assert.match(indexHtml, /id="rmWidget"/);
  assert.match(indexHtml, /תרגול לפי כיתה/);
  assert.match(indexHtml, /src\/lib\/mastery\.js/);
  assert.match(indexHtml, /src\/lib\/numberLine\.js/);
  assert.match(indexHtml, /src\/lib\/bar44\.js/);
});

test('teacher report escapes imported item text before injecting it into HTML', () => {
  // importRoster() stores session items from a pasted JSON file as-is, so
  // prompt / skill / kind must be escaped at render time, like student names.
  const report = indexHtml.match(/function renderTeacherReport\(\)[\s\S]*?\n/)[0];
  assert.match(report, /<td>\$\{escapeHtml\(s\.skill\)\}<\/td>/);
  assert.match(report, /<li>\$\{escapeHtml\(e\.prompt\)\}/);
  assert.match(report, /escapeHtml\(e\.skill\)/);
  assert.match(report, /escapeHtml\(KIND_HE\[s\.kind\]\|\|s\.kind\)/);
  assert.doesNotMatch(report, /\$\{s\.skill\}|\$\{e\.prompt\}|\|\|s\.kind\}/);
  assert.match(indexHtml, /escapeHtml\(KIND_HE\[r\.lastKind\]\|\|r\.lastKind\)/);
});
