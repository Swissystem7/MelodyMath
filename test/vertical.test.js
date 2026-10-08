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

test('vertical normalize handles negative operands by setting them to 0', () => {
  const result = vert.normalizeVertical({ a: -5, b: 3, op: '+' });
  assert.deepStrictEqual(result, {
    a: 0,
    b: 3,
    op: '+'
  });
});

test('vertical normalize caps huge operands so the column never shows exponent form', () => {
  const V = vert.normalizeVertical({ a: 1e21, b: Infinity, op: '+' });
  assert.equal(V.a, vert.MAX_OPERAND);
  assert.equal(V.b, 0);
  const html = vert.renderVerticalHtml({ a: 1e21, b: 123456, op: '-' });
  assert.doesNotMatch(html, /e\+/);
  assert.match(html, /9999 פחות 9999/);
});

test('vertical normalize keeps a four-digit operand as is', () => {
  assert.equal(vert.normalizeVertical({ a: 9999, b: 1000 }).a, 9999);
  assert.equal(vert.normalizeVertical({ a: 9999, b: 1000 }).b, 1000);
});
