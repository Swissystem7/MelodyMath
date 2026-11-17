const { test, describe } = require('node:test');
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

describe('vertical subtraction across zero and double regrouping', () => {
  test('formats 100 - 27 with minus operator, exact aria-label, and aligned rows', () => {
    const html = vert.renderVerticalHtml({ a: 100, b: 27, op: '-' });
    assert.match(html, /aria-label="חישוב מאונך: 100 פחות 27"/);
    assert.match(html, /<span class="vert-op" aria-hidden="true">-<\/span>/);
    assert.match(html, /<div class="vert-row vert-a">100<\/div>/);
    assert.match(html, /<div class="vert-row vert-b"><span class="vert-op" aria-hidden="true">-<\/span>27<\/div>/);
    assert.match(html, /<div class="vert-line" aria-hidden="true"><\/div>/);
  });

  test('formats 1000 - 456 across multiple zeros with minus operator and aligned rows', () => {
    const html = vert.renderVerticalHtml({ a: 1000, b: 456, op: '-' });
    assert.match(html, /aria-label="חישוב מאונך: 1000 פחות 456"/);
    assert.match(html, /<span class="vert-op" aria-hidden="true">-<\/span>/);
    assert.match(html, /<div class="vert-row vert-a">1000<\/div>/);
    assert.match(html, /<div class="vert-row vert-b"><span class="vert-op" aria-hidden="true">-<\/span>456<\/div>/);
  });

  test('formats 503 - 248 with non-breaking space padding on minuend to align with operator column', () => {
    const html = vert.renderVerticalHtml({ a: 503, b: 248, op: '-' });
    assert.match(html, /aria-label="חישוב מאונך: 503 פחות 248"/);
    assert.match(html, /<span class="vert-op" aria-hidden="true">-<\/span>/);
    assert.match(html, /<div class="vert-row vert-a">\u00a0503<\/div>/);
    assert.match(html, /<div class="vert-row vert-b"><span class="vert-op" aria-hidden="true">-<\/span>248<\/div>/);
  });

  test('pads single-digit subtrahend with non-breaking space when subtracting across zeros (e.g. 100 - 7)', () => {
    const html = vert.renderVerticalHtml({ a: 100, b: 7, op: '-' });
    assert.match(html, /aria-label="חישוב מאונך: 100 פחות 7"/);
    assert.match(html, /<span class="vert-op" aria-hidden="true">-<\/span>/);
    assert.match(html, /<div class="vert-row vert-a">100<\/div>/);
    assert.match(html, /<div class="vert-row vert-b"><span class="vert-op" aria-hidden="true">-<\/span>\u00a07<\/div>/);
  });
});

describe('vertical addition with double carrying and regrouping', () => {
  test('formats 98 + 95 with plus operator, exact aria-label, and padded first addend row', () => {
    const html = vert.renderVerticalHtml({ a: 98, b: 95, op: '+' });
    assert.match(html, /aria-label="חישוב מאונך: 98 ועוד 95"/);
    assert.match(html, /<span class="vert-op" aria-hidden="true">\+<\/span>/);
    assert.match(html, /<div class="vert-row vert-a">\u00a098<\/div>/);
    assert.match(html, /<div class="vert-row vert-b"><span class="vert-op" aria-hidden="true">\+<\/span>95<\/div>/);
    assert.match(html, /<div class="vert-line" aria-hidden="true"><\/div>/);
  });

  test('formats 489 + 537 with plus operator, exact aria-label, and padded first addend row', () => {
    const html = vert.renderVerticalHtml({ a: 489, b: 537, op: '+' });
    assert.match(html, /aria-label="חישוב מאונך: 489 ועוד 537"/);
    assert.match(html, /<span class="vert-op" aria-hidden="true">\+<\/span>/);
    assert.match(html, /<div class="vert-row vert-a">\u00a0489<\/div>/);
    assert.match(html, /<div class="vert-row vert-b"><span class="vert-op" aria-hidden="true">\+<\/span>537<\/div>/);
  });

  test('formats 999 + 1 cascading regrouping with non-breaking spaces padding second addend', () => {
    const html = vert.renderVerticalHtml({ a: 999, b: 1, op: '+' });
    assert.match(html, /aria-label="חישוב מאונך: 999 ועוד 1"/);
    assert.match(html, /<span class="vert-op" aria-hidden="true">\+<\/span>/);
    assert.match(html, /<div class="vert-row vert-a">999<\/div>/);
    assert.match(html, /<div class="vert-row vert-b"><span class="vert-op" aria-hidden="true">\+<\/span>\u00a01<\/div>/);
  });
});
