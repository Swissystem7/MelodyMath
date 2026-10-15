const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

// Measured 28.9.2026 in Chromium at 390px: offer.html scrolled sideways to 432px
// (the one-pager URLs do not wrap) and curriculum.html to 414px (the coverage
// table is wider than its card). Teachers open these links on a phone.
test('the offer one-pager wraps its long URLs instead of widening the phone page', () => {
  assert.match(read('offer.html'), /\.onepager \.urls[^{]*\{[^}]*overflow-wrap:anywhere/);
});

test('the coverage table scrolls inside its card, not the whole page', () => {
  const css = read('curriculum.html');
  assert.match(css, /\.grade-block\{[^}]*overflow-x:auto/);
});

// Measured again 28.9.2026 at 390px: once the teacher fills name, school and grade,
// the letter preview (<pre>, white-space:pre-wrap) prints the demo and offer URLs,
// which do not break, and offer.html widens to 524px.
test('the principal-letter preview wraps its URLs on a phone', () => {
  assert.match(read('offer.html'), /#letterPreview\{[^}]*overflow-wrap:anywhere/);
});

// 807.html measured 392px at a 390px viewport: the answer input keeps its intrinsic
// min-width inside the flex row, so the row is 355px in a 316px box.
test('the 807 answer input can shrink inside its flex row', () => {
  assert.match(read('807.html'), /input\[type=text\]\{flex:1; min-width:0;/);
});
