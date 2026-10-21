const test = require('node:test');
const assert = require('node:assert/strict');
const cur = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');
const dataViz = require('../src/lib/dataViz');

// #409 — the grade א "דיאגרמת עמודות ופיקטוגרם" row is marked covered; these
// checks make sure the bank behind it is real, renderable and answerable.
const items = banks.rowsOf('data', 'א');
const pict = items.filter((it) => it.standard === banks.ST.PICTOGRAM);
const bars = items.filter((it) => it.standard === banks.ST.BARCHART);

function valuesOf(it) {
  return it.widget === 'pictogram'
    ? it.chart.rows.map((r) => r.count / it.chart.key)
    : it.chart.bars.map((b) => b.value);
}

test('the grade א data row is covered only because pictogram and bar chart items exist', () => {
  const row = cur.rowsForGrade('א').find((r) => r.strand === 'data');
  assert.ok(row, 'grade א has a data row');
  assert.match(row.topic, /דיאגרמת עמודות/);
  assert.match(row.topic, /פיקטוגרם/);
  assert.equal(row.status, cur.COVERED);
  assert.ok(pict.length >= 4, 'pictogram items: ' + pict.length);
  assert.ok(bars.length >= 4, 'bar chart items: ' + bars.length);
  assert.ok(banks.skillsForGrade('א').includes('data'));
});

test('every grade א data item is a pictogram or bar chart with a chart to read', () => {
  assert.equal(pict.length + bars.length, items.length);
  pict.forEach((it) => {
    assert.equal(it.widget, 'pictogram', it.prompt);
    assert.equal(it.chart.key, 1, 'grade א pictograms use key 1: ' + it.prompt);
    assert.ok(it.prompt.includes(it.chart.icon), 'prompt names the icon: ' + it.prompt);
    assert.ok(it.chart.rows.length >= 2, it.prompt);
  });
  bars.forEach((it) => {
    assert.equal(it.widget, 'barchart', it.prompt);
    assert.ok(it.chart.bars.length >= 2, it.prompt);
  });
});

test('grade א charts stay within numbers a first grader counts (each value ≤ 10, total ≤ 20)', () => {
  items.forEach((it) => {
    const vals = valuesOf(it);
    vals.forEach((v) => assert.ok(Number.isInteger(v) && v >= 0 && v <= 10, it.prompt + ' → ' + v));
    assert.ok(vals.reduce((a, b) => a + b, 0) <= 20, it.prompt);
  });
});

test('every grade א data answer is read off the chart: a value, a difference, a pair sum or the total', () => {
  items.forEach((it) => {
    const vals = valuesOf(it);
    const ok = new Set(vals);
    vals.forEach((a, i) => vals.forEach((b, j) => {
      if (a > b) ok.add(a - b);
      if (i < j) ok.add(a + b);
    }));
    ok.add(vals.reduce((a, b) => a + b, 0));
    assert.ok(ok.has(it.answer), it.prompt + ' → ' + it.answer + ' not in ' + [...ok].join(','));
  });
});

test('grade א pictograms and bar charts each span levels 1 to 3', () => {
  [pict, bars].forEach((group) => {
    [1, 2, 3].forEach((level) => assert.ok(group.some((it) => it.level === level), group[0].widget + ' level ' + level));
  });
});

test('every grade א chart renders with all its labels and the right number of symbols', () => {
  pict.forEach((it) => {
    const html = dataViz.renderPictogramHtml(it.chart);
    it.chart.rows.forEach((r) => assert.ok(html.includes(r.label), r.label));
    const symbols = (html.match(new RegExp(it.chart.icon, 'gu')) || []).length;
    const expected = 1 + it.chart.rows.reduce((s, r) => s + r.count / it.chart.key, 0);
    assert.equal(symbols, expected, it.prompt);
  });
  bars.forEach((it) => {
    const html = dataViz.renderBarChartHtml(it.chart);
    assert.equal((html.match(/barchart-col/g) || []).length, it.chart.bars.length, it.prompt);
    it.chart.bars.forEach((b) => {
      assert.ok(html.includes(b.label), b.label);
      assert.ok(html.includes('>' + b.value + '<'), b.label + ' value');
    });
  });
});

test('the grade א diagnostic checks pictogram reading', () => {
  const diag = banks.diagnosticItems('א').filter((it) => it.skill === 'data');
  assert.ok(diag.length >= 1);
  diag.forEach((it) => assert.ok(it.standard === banks.ST.PICTOGRAM || it.standard === banks.ST.BARCHART));
});
