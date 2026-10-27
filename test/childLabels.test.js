// #665 requirement 1: the child never sees the technical label "מרווחים" (intervals).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('index.html has no "מרווחים" label in the tab, the practice card or the exercise meta', () => {
  assert.doesNotMatch(html, /מרווחים/);
});

test('the practice tab and level button use the plain word "צלילים" instead', () => {
  assert.match(html, /data-tab="practice">צלילים וטמפו</);
  assert.match(html, /<strong>אתגר<\/strong>פונקציות וצלילים</);
  assert.match(html, /\[3,1,'יחסים','צלילים',/);
});
