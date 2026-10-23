// #559: every grade ד׳ row of Newprogramgrade4.pdf is covered, and only
// because real bank items carry its verified tag. Answers are recomputed
// here, not trusted.
const test = require('node:test');
const assert = require('node:assert/strict');
const cur = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');
const viz = require('../src/lib/dataViz');
const { isCorrect } = require('../src/lib/adaptive');

const ST = banks.ST;
const items = banks.itemsForGrade('ד');

test('every grade ד׳ row is covered, verified, and opens at least four exercises', () => {
  assert.equal(cur.coveragePercent('ד').covered, 100);
  cur.programForGrade('ד', items).rows.forEach((r) => {
    assert.equal(r.status, cur.COVERED, r.topic);
    assert.ok(r.verified && r.page > 0, r.topic);
    assert.ok(r.exerciseCount >= 4, r.topic + ' has ' + r.exerciseCount);
  });
});

test('each new grade ד׳ standard has items at levels 1, 2 and 3 and a verified tag', () => {
  [ST.NUM_MILLION, ST.ADD_SUB_MILLION, ST.MUL_DIV_VERT, ST.ORDER_OPS, ST.FRAC_OF_QTY, ST.FRAC_NAMES,
    ST.FRAC_ADD_D, ST.BOX_AREA, ST.TABLE, ST.BARCHART, ST.PIE].forEach((st) => {
    const mine = items.filter((it) => it.standard === st);
    [1, 2, 3].forEach((lv) => assert.ok(mine.some((it) => it.level === lv), st + ' level ' + lv));
    mine.forEach((it) => {
      assert.ok(cur.sectionForItem(it).verified, it.id);
      assert.ok(isCorrect(String(it.answer), it.answer), it.id);
      if (Number(it.answer) >= 1000) assert.match(it.prompt, /בלי פסיק/, it.id);
    });
  });
});

test('plain grade ד׳ arithmetic and the vertical columns agree with their answers', () => {
  const calc = (s) => Function('return (' + s.replace(/,/g, '').replace(/×/g, '*').replace(/:/g, '/').replace(/−/g, '-') + ')')();
  let checked = 0;
  items.forEach((it) => {
    const m = /^([\d,()+−×: ]+) = \?/.exec(it.prompt);
    if (m) { checked += 1; assert.equal(calc(m[1]), it.answer, it.id); }
    if (it.vert && it.vert.a > 9999) {
      checked += 1;
      assert.equal(it.vert.op === '+' ? it.vert.a + it.vert.b : it.vert.a - it.vert.b, it.answer, it.id);
    }
  });
  assert.ok(checked >= 18, 'only ' + checked + ' checked');
});

test('the pie chart draws one wedge per part and names the slices without fractions', () => {
  const pies = items.filter((it) => it.widget === 'pie');
  assert.ok(pies.length >= 4);
  pies.forEach((it) => {
    const html = viz.renderPieChartHtml(it.chart);
    assert.equal((html.match(/<path /g) || []).length, it.chart.parts, it.id);
    it.chart.slices.forEach((s) => assert.ok(html.includes(s.label), it.id));
    assert.doesNotMatch(html, /\d\/\d/);
  });
  assert.equal(viz.normalizePie({ parts: 2, slices: [{ label: 'a', parts: 3 }] }).parts, 3);
  assert.doesNotMatch(viz.renderPieChartHtml({ slices: [{ label: '<b>', parts: 1 }] }), /<b>/);
});
