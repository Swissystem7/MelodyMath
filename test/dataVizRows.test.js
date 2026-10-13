const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../src/lib/dataViz');

test('a pictogram icon is escaped in every row, not only in the key line', () => {
  const html = data.renderPictogramHtml({ icon: '<img src=x onerror=alert(1)>', key: 1, rows: [{ label: 'a', count: 2 }] });
  assert.equal(html.indexOf('<img'), -1);
  assert.equal((html.match(/&lt;img/g) || []).length, 3);
});

test('a non-string pictogram icon falls back to the default dot', () => {
  assert.equal(data.normalizePictogram({ icon: { bad: true } }).icon, '●');
  assert.equal(data.normalizePictogram({ icon: '   ' }).icon, '●');
  assert.equal(data.normalizePictogram({ icon: 7 }).icon, '7');
});

test('pictogram rows that are not objects are skipped instead of throwing', () => {
  const P = data.normalizePictogram({ key: 1, rows: [null, 3, 'x', [1, 2], { label: 'ok', count: 2 }] });
  assert.deepEqual(P.rows, [{ label: 'ok', count: 2 }]);
  const html = data.renderPictogramHtml({ key: 1, rows: [null, { label: 'ok', count: 1 }] });
  assert.match(html, /ok/);
});

test('a row with a missing label renders an empty header, not the word undefined', () => {
  const html = data.renderPictogramHtml({ key: 1, rows: [{ count: 1 }] });
  assert.doesNotMatch(html, /undefined/);
  assert.match(html, /<th scope="row"><\/th>/);
});

test('bars that are not objects are skipped instead of throwing', () => {
  const B = data.normalizeBars({ bars: [null, 'x', { label: 'a', value: 4 }] });
  assert.deepEqual(B.bars, [{ label: 'a', value: 4 }]);
  assert.equal(B.max, 4);
});

test('an explicit max below the tallest bar does not push that bar past the track', () => {
  const B = data.normalizeBars({ max: 2, bars: [{ label: 'a', value: 8 }] });
  assert.equal(B.max, 8);
  const html = data.renderBarChartHtml({ max: 2, bars: [{ label: 'a', value: 8 }] });
  assert.match(html, /height:100%/);
  assert.doesNotMatch(html, /height:400%/);
});

test('an explicit max above the tallest bar still sets the scale', () => {
  const B = data.normalizeBars({ max: 10, bars: [{ label: 'a', value: 5 }] });
  assert.equal(B.max, 10);
  assert.match(data.renderBarChartHtml({ max: 10, bars: [{ label: 'a', value: 5 }] }), /height:50%/);
});
