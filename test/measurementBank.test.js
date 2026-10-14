const test = require('node:test');
const assert = require('node:assert/strict');

const banks = require('../src/lib/banks');
const measure = require('../src/lib/measure');
const { isCorrect } = require('../src/lib/adaptive');

const rows = (grade) => banks.rowsOf('measurement', grade);

const MEASURE_STANDARDS = [
  banks.ST.LENGTH, banks.ST.CLOCK, banks.ST.HALF_HOUR, banks.ST.PERIMETER,
  banks.ST.MINUTES, banks.ST.AREA, banks.ST.UNITS, banks.ST.CALENDAR,
  banks.ST.MONEY, banks.ST.MASS_VOL,
];

// The sections the programme asks of each grade א׳–ד׳. Every one of them has
// to hold items, otherwise a grade silently loses a measurement topic.
const SECTIONS = {
  'א': [banks.ST.LENGTH, banks.ST.CLOCK, banks.ST.MONEY],
  'ב': [banks.ST.LENGTH, banks.ST.CLOCK, banks.ST.HALF_HOUR, banks.ST.PERIMETER, banks.ST.MONEY, banks.ST.MASS_VOL],
  'ג': [banks.ST.MINUTES, banks.ST.AREA, banks.ST.MONEY, banks.ST.MASS_VOL],
  'ד': [banks.ST.UNITS, banks.ST.CALENDAR, banks.ST.MONEY],
};

test('every grade א׳–ד׳ has tagged measurement items at all three levels', () => {
  ['א', 'ב', 'ג', 'ד'].forEach((g) => {
    assert.ok(banks.skillsForGrade(g).includes('measurement'), g);
    const items = rows(g);
    assert.ok(items.length >= 12, g + ' has ' + items.length);
    [1, 2, 3].forEach((lv) => {
      assert.ok(items.filter((it) => it.level === lv).length >= 2, g + ' level ' + lv);
    });
    items.forEach((it) => {
      assert.equal(it.grade, g, it.id);
      assert.equal(it.strand, banks.STRAND.MEASURE, it.id);
      assert.ok(MEASURE_STANDARDS.includes(it.standard), it.id + ' ' + it.standard);
      assert.equal(banks.isShippable(it), true, it.id);
    });
  });
});

test('each grade keeps every measurement section of its year non-empty', () => {
  Object.keys(SECTIONS).forEach((g) => {
    SECTIONS[g].forEach((standard) => {
      const section = rows(g).filter((it) => it.standard === standard);
      assert.ok(section.length >= 4, g + ' / ' + standard + ' has ' + section.length);
      assert.ok(section.some((it) => it.level === 1), g + ' / ' + standard + ' L1');
      assert.ok(section.some((it) => it.level === 3), g + ' / ' + standard + ' L3');
    });
  });
});

test('measurement answers are whole numbers a child can type, with the unit in the prompt', () => {
  ['א', 'ב', 'ג', 'ד'].forEach((g) => {
    rows(g).forEach((it) => {
      if (typeof it.answer === 'number') {
        assert.equal(Number.isInteger(it.answer), true, it.id + ' answer ' + it.answer);
        assert.ok(it.answer >= 0, it.id);
      }
      assert.ok(isCorrect(String(it.answer), it.answer), it.id);
      assert.ok(String(it.hint).trim().length > 0, it.id + ' has no hint');
    });
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

test('unit answers in the bank agree with measure.convert', () => {
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
  assert.equal(money, 24);
});

test('a measurement prompt renders as Hebrew RTL with its math kept LTR', () => {
  const { mathHtml } = require('../src/lib/mathBidi');
  ['א', 'ב', 'ג', 'ד'].forEach((g) => {
    rows(g).forEach((it) => {
      const html = mathHtml(it.prompt);
      assert.doesNotMatch(html, /<(?!\/?span)/, it.id + ' injects markup');
      // ₪ and אגורות are Hebrew-flow text, so they must not be swallowed by
      // an LTR isolate — only operator runs such as "3:30" get one.
      if (/₪/.test(it.prompt)) assert.match(html, /₪/, it.id);
      mathHtml(it.prompt).replace(/<span class="math-ltr" dir="ltr">([^<]*)<\/span>/g, function (_, run) {
        assert.doesNotMatch(run, /[א-ת]/, it.id + ' put Hebrew inside an LTR run');
        return run;
      });
    });
  });
});

test('the diagnostic and personal practice reach measurement in every grade א׳–ד׳', () => {
  ['א', 'ב', 'ג', 'ד'].forEach((g) => {
    const diag = banks.diagnosticItems(g).filter((it) => it.skill === 'measurement');
    assert.deepEqual(diag.map((it) => it.level), [1, 2], g);
    assert.ok(diag.every((it) => it.grade === g), g);
    assert.equal(banks.practiceItems(['measurement'], g).length, rows(g).length, g);
  });
  assert.equal(banks.coverage().measurement.grade, 'א׳–ד׳');
});

test('item ids of the existing bank did not move', () => {
  const ids = banks.allItems().map((it) => it.id);
  ['א-measurement-321', 'א-data-345', 'א-data-349'].forEach((id) => assert.ok(ids.includes(id), id));
  const added = banks.allItems()
    .filter((it) => it.standard === banks.ST.MONEY || it.standard === banks.ST.MASS_VOL)
    .map((it) => Number(it.id.split('-').pop()));
  assert.ok(Math.min(...added) > 636, 'new items sit after every older item');
});
