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
