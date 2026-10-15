const test = require('node:test');
const assert = require('node:assert/strict');

const banks = require('../src/lib/banks');
const measure = require('../src/lib/measure');
const { isCorrect } = require('../src/lib/adaptive');

const measurement = (grade) => banks.rowsOf('measurement', grade);
const ST = banks.ST;
const BY_GRADE = {
  'ב': [ST.LENGTH, ST.CLOCK, ST.HALF_HOUR, ST.PERIMETER],
  // Grid cells are not square units and minutes→seconds is not a clock face,
  // so the grade-ג׳ music items keep standards of their own (#177).
  'ג': [ST.MINUTES, ST.AREA, ST.AREA_RECT, ST.TIME_MIN_SEC],
  'ד': [ST.UNITS, ST.CALENDAR],
};
// A few items answer with a clock reading ("2:30") rather than a count.
const CLOCK_ANSWER = /^\d{1,2}:\d{2}$/;

test('convertUnits changes units within one kind and refuses to mix kinds', () => {
  assert.equal(measure.convertUnits(2, 'מטרים', 'ס״מ'), 200);
  assert.equal(measure.convertUnits(3, 'ק״ג', 'גרם'), 3000);
  assert.equal(measure.convertUnits(30, 'מ״מ', 'ס״מ'), 3);
  assert.equal(measure.convertUnits(0.5, 'ליטר', 'מ״ל'), 500);
  assert.equal(measure.convertUnits(2, 'יממות', 'שעות'), 48);
  assert.equal(measure.convertUnits(3, 'שבועות', 'ימים'), 21);
  assert.equal(measure.convertUnits(1, 'ק״ג', 'מטר'), null);
  assert.equal(measure.convertUnits(1, 'רגל', 'ס״מ'), null);
  assert.equal(measure.convertUnits('x', 'מטר', 'ס״מ'), null);
});

test('rectArea and perimeter refuse what is not a shape', () => {
  assert.equal(measure.rectArea(7, 3), 21);
  assert.equal(measure.rectArea(0, 3), null);
  assert.equal(measure.rectArea('a', 3), null);
  assert.equal(measure.perimeter([5, 2, 5, 2]), 14);
  assert.equal(measure.perimeter([3, 4]), null);
  assert.equal(measure.perimeter([3, -4, 5]), null);
});

test('grades ב׳–ד׳ have tagged measurement items at every level', () => {
  Object.keys(BY_GRADE).forEach((g) => {
    assert.ok(banks.skillsForGrade(g).includes('measurement'), g);
    const rows = measurement(g);
    assert.ok(rows.length >= 12, g + ' has ' + rows.length);
    [1, 2, 3].forEach((lv) => assert.ok(rows.some((it) => it.level === lv), g + ' level ' + lv));
    rows.forEach((it) => {
      assert.equal(it.strand, banks.STRAND.MEASURE, it.id);
      assert.ok(BY_GRADE[g].includes(it.standard), it.id + ' ' + it.standard);
      const countable = Number.isInteger(it.answer) && it.answer > 0;
      assert.ok(countable || CLOCK_ANSWER.test(String(it.answer)), it.id + ' answers ' + it.answer);
      assert.ok(isCorrect(String(it.answer), it.answer), it.id);
    });
    BY_GRADE[g].forEach((st) => assert.ok(rows.some((it) => it.standard === st), g + ' ' + st));
  });
});

test('unit-change answers agree with convertUnits', () => {
  let checked = 0;
  ['ג', 'ד'].forEach((g) => measurement(g).forEach((it) => {
    const m = it.prompt.match(/^כמה (\S+) יש ב־(\d+) (\S+)\?$/);
    if (!m) return;
    checked += 1;
    assert.equal(it.answer, measure.convertUnits(Number(m[2]), m[3], m[1]), it.id);
  }));
  assert.ok(checked >= 7, 'checked ' + checked);
});

test('area and perimeter answers agree with measure.js', () => {
  let areas = 0;
  let perims = 0;
  measurement('ג').forEach((it) => {
    const m = it.prompt.match(/^מלבן שאורכו (\d+) ס״מ ורוחבו (\d+) ס״מ\. מה שטחו/);
    if (m) { areas += 1; assert.equal(it.answer, measure.rectArea(m[1], m[2]), it.id); }
    const sq = it.prompt.match(/^ריבוע שצלעו (\d+) ס״מ\. מה שטחו/);
    if (sq) { areas += 1; assert.equal(it.answer, measure.rectArea(sq[1], sq[1]), it.id); }
  });
  measurement('ב').forEach((it) => {
    const tri = it.prompt.match(/^למשולש צלעות של (\d+), (\d+) ו־(\d+) ס״מ/);
    if (tri) { perims += 1; assert.equal(it.answer, measure.perimeter(tri.slice(1)), it.id); }
    const rect = it.prompt.match(/^למלבן צלעות של (\d+) ס״מ ו־(\d+) ס״מ/);
    if (rect) { perims += 1; assert.equal(it.answer, measure.perimeter([rect[1], rect[2], rect[1], rect[2]]), it.id); }
  });
  assert.ok(areas >= 3 && perims >= 2, areas + ' ' + perims);
});

test('the diagnostic and personal practice for ג׳ and ד׳ reach the measurement items', () => {
  ['ג', 'ד'].forEach((g) => {
    const diag = banks.diagnosticItems(g).filter((it) => it.skill === 'measurement');
    assert.deepEqual(diag.map((it) => it.level), [1, 2], g);
    assert.ok(diag.every((it) => it.grade === g), g);
    assert.equal(banks.practiceItems(['measurement'], g).length, measurement(g).length, g);
  });
  assert.equal(banks.coverage().measurement.grade, 'א׳–ד׳');
});

test('the ruler and clock items of א׳–ב׳ keep their ids', () => {
  const ids = banks.allItems().map((it) => it.id);
  ['א-measurement-321', 'א-data-345'].forEach((id) => assert.ok(ids.includes(id), id));
  const ruler = (it) => it.standard === ST.LENGTH || it.standard === ST.CLOCK;
  const oldIds = banks.allItems().filter(ruler).map((it) => Number(it.id.split('-').pop()));
  const newIds = banks.allItems().filter((it) => it.skill === 'measurement' && !ruler(it))
    .map((it) => Number(it.id.split('-').pop()));
  assert.ok(Math.min(...newIds) > Math.max(...oldIds), 'the later items sit after the older ones');
});
