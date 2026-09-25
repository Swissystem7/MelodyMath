const test = require('node:test');
const assert = require('node:assert/strict');
const vert = require('../src/lib/vertical');

test('addition that crosses ten draws the carried 1 above the tens column', () => {
  const html = vert.renderVerticalHtml({ a: 47, b: 25, op: '+' });
  assert.match(html, /vert-carry/);
  assert.match(html, /נשיאה/);
  assert.equal(vert.carryOf(47, 25, '+'), 1);
});

test('addition that stays inside ten draws no carry row', () => {
  const html = vert.renderVerticalHtml({ a: 21, b: 34, op: '+' });
  assert.doesNotMatch(html, /vert-carry/);
});

test('subtraction never draws a carry row', () => {
  const html = vert.renderVerticalHtml({ a: 68, b: 39, op: '-' });
  assert.doesNotMatch(html, /vert-carry/);
});

test('column padding is non-breaking (U+00A0), so HTML does not collapse it', () => {
  for (const [a, b] of [[47, 25], [8, 15], [7, 5]]) {
    const html = vert.renderVerticalHtml({ a, b, op: '+' });
    const rows = [...html.matchAll(/<div class="vert-row[^"]*"[^>]*>([\s\S]*?)<\/div>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, ''));
    assert.ok(rows.length >= 2);
    for (const r of rows) assert.doesNotMatch(r, /[ \t\n]/, `collapsible whitespace in row "${r}"`);
  }
  const html = vert.renderVerticalHtml({ a: 8, b: 15, op: '+' });
  assert.match(html, /<div class="vert-row vert-a">  8<\/div>/);
  assert.match(html, /<div class="vert-row vert-carry" aria-hidden="true"> 1<\/div>/);
});
