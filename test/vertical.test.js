const test = require('node:test');
const assert = require('node:assert/strict');
const vert = require('../src/lib/vertical');

test('vertical addition stacks the two addends with a plus sign', () => {
  const html = vert.renderVerticalHtml({ a: 47, b: 25, op: '+' });
  assert.match(html, /47 ועוד 25/);
  assert.match(html, /vert-op"[^>]*>\+</);
  assert.doesNotMatch(html, /<script/);
});

test('vertical subtraction stacks minuend and subtrahend with a minus sign', () => {
  const html = vert.renderVerticalHtml({ a: 68, b: 39, op: '-' });
  assert.match(html, /68 פחות 39/);
  assert.match(html, /vert-op"[^>]*>-</);
});

test('an unrecognised op falls back to addition', () => {
  const V = vert.normalizeVertical({ a: 1, b: 2 });
  assert.equal(V.op, '+');
});

test('vertical clamps values outside the 0-99 range to the nearest boundary', () => {
  const result1 = vert.normalizeVertical({ a: -5, b: 10 });
  assert.strictEqual(result1.a, 0);
  assert.strictEqual(result1.b, 10);
  assert.strictEqual(result1.op, '+');

  const result2 = vert.normalizeVertical({ a: 100, b: 50 });
  assert.strictEqual(result2.a, 99);
  assert.strictEqual(result2.b, 50);
  assert.strictEqual(result2.op, '+');
});
