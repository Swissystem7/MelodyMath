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
