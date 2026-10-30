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

// vertical.js draws the column and nothing else; the grade-ב music layer on
// top of it is grade2Music.js (#103).
test('vertical API is display-only', () => {
  assert.deepStrictEqual(Object.keys(vert).sort(), [
    'bindVertical',
    'normalizeVertical',
    'renderVerticalHtml',
    'MAX_OPERAND'
  ].sort());
});

test('vertical normalize caps huge operands so the column never shows exponent form', () => {
  const V = vert.normalizeVertical({ a: 1e21, b: Infinity, op: '+' });
  assert.equal(V.a, vert.MAX_OPERAND);
  assert.equal(V.b, 0);
  const html = vert.renderVerticalHtml({ a: 1e21, b: 123456, op: '-' });
  assert.doesNotMatch(html, /e\+/);
  assert.match(html, /999999 פחות 123456/);
});

test('vertical normalize keeps a four- or six-digit operand and 10,000 as is', () => {
  assert.equal(vert.normalizeVertical({ a: 700000, b: 286435 }).b, 286435);
  assert.equal(vert.normalizeVertical({ a: 9999, b: 1000 }).a, 9999);
  assert.equal(vert.normalizeVertical({ a: 9999, b: 1000 }).b, 1000);
  assert.equal(vert.normalizeVertical({ a: 10000, b: 3648, op: '-' }).a, 10000);
  assert.match(vert.renderVerticalHtml({ a: 10000, b: 3648, op: '-' }), /10000 פחות 3648/);
});
