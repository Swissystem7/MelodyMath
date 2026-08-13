const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../src/lib/dataViz');

test('a pictogram states its key and repeats the icon per row', () => {
  const html = data.renderPictogramHtml({ icon: '🍎', key: 2, rows: [{ label: 'תפוחים', count: 6 }] });
  assert.match(html, /כל 🍎 = 2/);
  assert.match(html, /תפוחים/);
  assert.equal((html.match(/🍎/g) || []).length, 1 + 3);
});

test('a bar chart renders one column per bar with its value', () => {
  const html = data.renderBarChartHtml({ bars: [{ label: 'כדורגל', value: 5 }, { label: 'כדורסל', value: 3 }] });
  assert.equal((html.match(/barchart-col/g) || []).length, 2);
  assert.match(html, />5</);
  assert.match(html, /כדורסל/);
});

test('a data table renders headers and rows', () => {
  const html = data.renderTableHtml({ headers: ['פרי', 'כמות'], rows: [['תפוח', '4'], ['בננה', '2']] });
  assert.match(html, /<th scope="col">פרי<\/th>/);
  assert.match(html, /תפוח/);
  assert.match(html, /בננה/);
  assert.equal((html.match(/<tr>/g) || []).length, 3);
});

test('none of the widgets emit a script tag', () => {
  const a = data.renderPictogramHtml({ icon: '●', key: 1, rows: [{ label: 'x', count: 1 }] });
  const b = data.renderBarChartHtml({ bars: [{ label: 'x', value: 1 }] });
  const c = data.renderTableHtml({ headers: ['a'], rows: [['b']] });
  assert.doesNotMatch(a, /<script/);
  assert.doesNotMatch(b, /<script/);
  assert.doesNotMatch(c, /<script/);
});
