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

test('renderVerticalHtml includes data-op attribute with operation symbol', () => {
  const result = vert.renderVerticalHtml({a: 12, b: 5, op: '+'});
  const expected = '<div class="vert" dir="ltr" role="img" aria-label="חישוב מאונך: 12 ועוד 5" data-op="+"><div class="vert-row vert-a">12</div><div class="vert-row vert-b"><span class="vert-op" aria-hidden="true">+</span>5</div><div class="vert-line" aria-hidden="true"></div></div>';
  assert.strictEqual(result, expected);
});
