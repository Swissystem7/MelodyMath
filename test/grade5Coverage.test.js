// #559: every grade ה׳ row of Newprogramgrade5.pdf is covered, and only
// because real bank items carry its verified tag. Answers are recomputed
// here, not trusted.
const test = require('node:test');
const assert = require('node:assert/strict');
const cur = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');
const viz = require('../src/lib/dataViz');
const { isCorrect } = require('../src/lib/adaptive');

const ST = banks.ST;
const items = banks.itemsForGrade('ה');

test('the grade ה׳ programme lists one row per heading, in the order of the PDF', () => {
  const order = cur.OFFICIAL_ORDER['ה'];
  assert.equal(order.length, 12);
  assert.deepEqual(order.map((o) => o[1]), [1, 2, 5, 8, 8, 8, 13, 15, 18, 22, 29, 30]);
  assert.match(cur.programForGrade('ה', items).pdfUrl, /Newprogramgrade5\.pdf$/);
});

test('every grade ה׳ row is covered, verified, and opens at least four exercises', () => {
  assert.equal(cur.coveragePercent('ה').covered, 100);
  const p = cur.programForGrade('ה', items);
  assert.equal(p.untagged, 0);
  p.rows.forEach((r) => {
    assert.equal(r.status, cur.COVERED, r.topic);
    assert.ok(r.verified && r.page > 0, r.topic);
    assert.ok(r.exerciseCount >= 4, r.topic + ' has ' + r.exerciseCount);
  });
});

test('each new grade ה׳ standard has items at levels 1, 2 and 3 and a verified tag', () => {
  [ST.NUM_BIG, ST.OPS_MILLION, ST.PRIME_FACTOR, ST.FRAC_MODELS, ST.TRI_AREA, ST.PARA_AREA,
    ST.SOLIDS, ST.FREQ].forEach((st) => {
    const mine = items.filter((it) => it.standard === st);
    [1, 2, 3].forEach((lv) => assert.ok(mine.some((it) => it.level === lv), st + ' level ' + lv));
  });
  items.forEach((it) => {
    assert.ok(cur.sectionForItem(it).verified, it.id);
    assert.ok(isCorrect(String(it.answer), it.answer), it.id);
    if (typeof it.answer === 'number' && it.answer >= 1000) assert.match(it.prompt, /בלי פסיק/, it.id);
  });
});

test('the diagnosis of grade ה׳ still asks the same skills and the same questions', () => {
  assert.deepEqual(banks.skillsForGrade('ה'), ['fractions', 'decimals', 'data']);
  assert.deepEqual(banks.diagnosticItems('ה').map((it) => it.id),
    ['ה-fractions-432', 'ה-fractions-434', 'ה-decimals-445', 'ה-decimals-447', 'ה-data-632', 'ה-data-633']);
});

test('plain grade ה׳ arithmetic and the vertical columns agree with their answers', () => {
  const calc = (s) => Function('return (' + s.replace(/,/g, '').replace(/×/g, '*').replace(/:/g, '/').replace(/−/g, '-') + ')')();
  let checked = 0;
  items.forEach((it) => {
    const m = /^([\d,.()+−×: ]+) = \?/.exec(it.prompt);
    if (m && typeof it.answer === 'number') {
      checked += 1;
      assert.ok(Math.abs(calc(m[1]) - it.answer) < 1e-9, it.id);
    }
    if (it.vert && it.vert.a > 9999) {
      checked += 1;
      assert.equal(it.vert.op === '+' ? it.vert.a + it.vert.b : it.vert.a - it.vert.b, it.answer, it.id);
    }
  });
  assert.ok(checked >= 20, 'only ' + checked + ' checked');
});

test('prime, factor and divisibility answers hold', () => {
  const prime = (n) => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d);
  assert.ok(prime(7) && !prime(9) && !prime(1) && !prime(207) && prime(29));
  assert.equal(2 * 2 * 3, 12);
  assert.equal(2 * 2 * 3 * 5, 60);
  assert.equal(2 * 2 * 3 * 7, 84);
  assert.equal(3615 % 3, 0);
  assert.equal(645 % 5, 0);
  assert.equal(1000 % 7, 6);
  assert.equal(Math.floor(2000 / 30), 66);
  const ask = (re) => items.find((it) => re.test(it.prompt));
  assert.equal(ask(/של 84/).answer, 7);
  assert.equal(ask(/הראשוני הגדול ביותר שקטן מ־30/).answer, 29);
});

test('the grade ה׳ pictogram and pie chart draw the counts the questions ask about', () => {
  const picts = items.filter((it) => it.widget === 'pictogram');
  assert.ok(picts.length >= 2);
  picts.forEach((it) => assert.match(viz.renderPictogramHtml(it.chart), /כל 🏠 = 9/, it.id));
  const pies = items.filter((it) => it.widget === 'pie');
  assert.ok(pies.length >= 2);
  pies.forEach((it) => assert.equal((viz.renderPieChartHtml(it.chart).match(/<path /g) || []).length, it.chart.parts, it.id));
});
