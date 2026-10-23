const test = require('node:test');
const assert = require('node:assert/strict');

const banks = require('../src/lib/banks');
const measure = require('../src/lib/measure');
const { isCorrect } = require('../src/lib/adaptive');

const measurement = (grade) => banks.rowsOf('measurement', grade);
const rows = measurement;
const ST = banks.ST;
const BY_GRADE = {
  'א': [ST.LENGTH, ST.CLOCK, ST.MONEY],
  'ב': [ST.LENGTH, ST.CLOCK, ST.HALF_HOUR, ST.PERIMETER, ST.MONEY, ST.MASS_VOL, ST.MONEY_BILLS],
  // Grid cells are not square units and minutes→seconds is not a clock face,
  // so the grade-ג׳ music items keep standards of their own (#177).
  // ק״ג/ליטר moved to ד׳ (#591): they are not in the ג׳ programme.
  'ג': [ST.MINUTES, ST.AREA, ST.AREA_RECT, ST.TIME_MIN_SEC, ST.MONEY],
  'ד': [ST.UNITS, ST.CALENDAR, ST.MONEY],
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

test('grades א׳–ד׳ have tagged measurement items at every level', () => {
  Object.keys(BY_GRADE).forEach((g) => {
    assert.ok(banks.skillsForGrade(g).includes('measurement'), g);
    const items = measurement(g);
    assert.ok(items.length >= 12, g + ' has ' + items.length);
    [1, 2, 3].forEach((lv) => assert.ok(items.some((it) => it.level === lv), g + ' level ' + lv));
    items.forEach((it) => {
      assert.equal(it.strand, banks.STRAND.MEASURE, it.id);
      assert.ok(BY_GRADE[g].includes(it.standard), it.id + ' ' + it.standard);
      const countable = Number.isInteger(it.answer) && it.answer > 0;
      assert.ok(countable || CLOCK_ANSWER.test(String(it.answer)), it.id + ' answers ' + it.answer);
      assert.ok(isCorrect(String(it.answer), it.answer), it.id);
      assert.ok(String(it.hint).trim().length > 0, it.id + ' has no hint');
    });
    BY_GRADE[g].forEach((st) => assert.ok(items.some((it) => it.standard === st), g + ' ' + st));
  });
});

// Unit questions are the ones measure.convert can check on its own: the
// prompt names the amount and both units, so the answer is not a matter of
// taste. [regexp, from, to] — a miss here is a wrong answer in the bank.
const CONVERSIONS = [
  [/^כמה ס״מ יש ב־(\d+) מטרים/, 'm', 'cm'],
  [/^כמה מ״מ יש ב־(\d+) ס״מ/, 'cm', 'mm'],
  [/^כמה מטרים יש ב־(\d+) ק״מ/, 'km', 'm'],
  [/^כמה גרם יש ב־(\d+) ק״ג/, 'kg', 'g'],
  [/^כמה מ״ל יש ב־(\d+) ליטר/, 'l', 'ml'],
  [/^כמה אגורות יש ב־(\d+) ₪\?$/, 'shekel', 'agora'],
  [/^כמה דקות יש ב־(\d+) שעות/, 'hour', 'min'],
  [/^כמה ימים יש ב־(\d+) שבועות/, 'week', 'day'],
  [/^כמה שעות יש ב־(\d+) יממ/, 'day', 'hour'],
];

test('unit-change answers agree with convertUnits and measure.convert', () => {
  let checked = 0;
  ['א', 'ב', 'ג', 'ד'].forEach((g) => {
    rows(g).forEach((it) => {
      CONVERSIONS.forEach((rule) => {
        const m = rule[0].exec(it.prompt);
        if (!m) return;
        checked += 1;
        assert.equal(it.answer, measure.convert(m[1], rule[1], rule[2]), it.id + ' ' + it.prompt);
      });
    });
  });
  assert.ok(checked >= 10, 'only ' + checked + ' convertible prompts matched');
});

test('convert refuses an unknown unit and never crosses between families', () => {
  assert.equal(measure.convert(1, 'kg', 'l'), null);
  assert.equal(measure.convert(1, 'shekel', 'min'), null);
  assert.equal(measure.convert(1, 'cm', 'parsec'), null);
  assert.equal(measure.convert('abc', 'm', 'cm'), null);
  assert.equal(measure.convert(1, 'base', 'cm'), null);
  assert.equal(measure.familyOf('agora'), 'money');
  assert.equal(measure.familyOf('nope'), null);
  assert.equal(measure.convert(250, 'cm', 'm'), 2.5);
  assert.equal(measure.convert(1, 'year', 'day'), 365);
});

test('coinsTotal and change back the money items, and change refuses an underpayment', () => {
  assert.equal(measure.coinsTotal([[5, 1], [2, 1]]), 7);
  assert.equal(measure.coinsTotal([[2, 3]]), 6);
  assert.equal(measure.coinsTotal([[10, 1], [2, 2]]), 14);
  assert.equal(measure.coinsTotal([[5, 1], [2, 1], [1, 2]]), 9);
  assert.equal(measure.coinsTotal([[50, 4]]), measure.convert(2, 'shekel', 'agora'));
  assert.equal(measure.change(10, 3), 7);
  assert.equal(measure.change(50, 35), 15);
  assert.equal(measure.change(100, 64), 36);
  assert.equal(measure.change(200, measure.coinsTotal([[30, 6]])), 20);
  assert.equal(measure.change(3, 10), null, 'paying less than the price is not change');
  assert.equal(measure.coinsTotal([[1, -2]]), null);
  assert.equal(measure.coinsTotal([]), null);
  assert.equal(measure.coinsTotal('5'), null);
});

test('money items are tagged to the money standard and name ₪ or אגורות', () => {
  let money = 0;
  ['א', 'ב', 'ג', 'ד'].forEach((g) => {
    rows(g).filter((it) => it.standard === banks.ST.MONEY).forEach((it) => {
      money += 1;
      assert.match(it.prompt, /₪|אגורות/, it.id);
      assert.equal(it.strand, banks.STRAND.MEASURE, it.id);
    });
  });
  assert.ok(money >= 24, money + ' money items');
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

test('the diagnostic and personal practice reach measurement in every grade א׳–ד׳', () => {
  ['א', 'ב', 'ג', 'ד'].forEach((g) => {
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
