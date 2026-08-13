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
