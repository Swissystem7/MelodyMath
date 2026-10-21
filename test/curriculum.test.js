const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cur = require('../src/lib/curriculum');

test('the coverage matrix lists every grade and leaves gaps visible', () => {
  const rows = cur.coverageMatrix();
  assert.ok(rows.length >= 20);
  cur.grades().forEach((g) => {
    const sum = cur.summaryForGrade(g);
    assert.ok(sum.total >= 4, g);
    if (g === 'א' || g === 'ב' || g === 'ג' || g === 'ד' || g === 'ו') assert.equal(sum.gap, 0, g + ' gaps are closed');
    else assert.ok(sum.gap >= 1, 'grade ' + g + ' must show at least one honest gap');
  });
  assert.ok(rows.some((r) => r.grade === 'א' && r.status === 'covered' && /ספירה עד 100/.test(r.topic)));
  assert.ok(rows.some((r) => r.grade === 'א' && r.strand === 'geometry' && r.status === 'partial' && /אין פירוק/.test(r.note)));
  assert.ok(rows.some((r) => r.grade === 'ג' && r.strand === 'geometry' && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ד' && r.strand === 'geometry' && r.status === 'covered' && /שטח פנים של קובייה ושל תיבה/.test(r.note)));
  assert.ok(rows.some((r) => r.grade === 'א' && r.strand === 'measure' && r.status === 'covered' && /סרגל מצויר/.test(r.note)));
  assert.ok(rows.some((r) => r.grade === 'א' && r.strand === 'data' && r.status === 'covered' && /פיקטוגרם/.test(r.topic)));
  assert.ok(rows.some((r) => r.grade === 'ב' && r.strand === 'measure' && r.status === 'covered' && /נפח תיבות/.test(r.topic)));
  assert.ok(rows.some((r) => r.grade === 'ג' && r.strand === 'data' && r.status === 'covered' && /דיאגרמות/.test(r.topic)));
  assert.ok(rows.some((r) => r.grade === 'ג' && r.strand === 'measure' && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ד' && r.strand === 'measure' && r.status === 'covered' && /לוח עברי/.test(r.note)));
  assert.ok(rows.some((r) => r.grade === 'ב' && /חילוק/.test(r.topic) && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ד' && r.strand === 'fractions' && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ד' && r.status === 'covered' && /חלק מכמות/.test(r.topic)));
});

test('the coverage page is Hebrew RTL and renders covered vs gap', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'curriculum.html'), 'utf8');
  assert.match(page, /lang="he"/);
  assert.match(page, /dir="rtl"/);
  assert.match(page, /id="main"/);
  assert.match(page, /class="mm-skip"/);
  assert.match(page, /כיסוי תוכנית/);
  assert.match(page, /לא מכוסה|st-gap/);
  assert.doesNotMatch(page, /ADHD|דיסקלקול|15–20%|15-20%/i);
  assert.doesNotMatch(page, /סוגרים פערים במתמטיקה/);
});

test('strandHe should return Hebrew translation for numbers when given null', () => {
  const result = cur.strandHe(null);
  assert.strictEqual(result, 'מספרים ופעולות');
});

test('grade א-ג demo completion covers 10,000 addition/subtraction, tables, ×÷ 10/100/1000 and two-step problems (#356)', () => {
  const banks = require('../src/lib/banks');
  const rows = cur.coverageMatrix();
  assert.ok(rows.some((r) => r.grade === 'א' && /מצבי חיבור\/חיסור/.test(r.topic) && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ב' && /טבלה, עמודות, פיקטוגרם/.test(r.topic) && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ג' && /מספרים עד 10,000/.test(r.topic) && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ג' && /חיבור\/חיסור במאוזן ובמאונך עד רבבה/.test(r.topic) && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ג' && /כפל\/חילוק ב־10, 100, 1,000/.test(r.topic) && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ג' && /ודו־שלביות/.test(r.topic) && r.status === 'covered'));
  assert.equal(banks.rowsOf('addition', 'ג').length, 9);
  assert.equal(banks.rowsOf('subtraction', 'ג').length, 9);
  assert.ok(banks.rowsOf('data', 'ב').some((it) => it.standard === banks.ST.TABLE));
  assert.ok(banks.rowsOf('division', 'ג').some((it) => it.standard === banks.ST.MUL_DIV_10));
  assert.ok(banks.rowsOf('word_problems', 'ג').some((it) => it.standard === banks.ST.WORD_TWO_STEP));
});

test('grade א diagrams, grade ב cube volume and grade ג charts exist before the row is covered', () => {
  const banks = require('../src/lib/banks');
  const pict = banks.rowsOf('data', 'א').filter((it) => it.standard === banks.ST.PICTOGRAM);
  const bars = banks.rowsOf('data', 'א').filter((it) => it.standard === banks.ST.BARCHART);
  assert.ok(pict.length >= 4 && bars.length >= 4);
  const cubes = banks.rowsOf('measurement', 'ב').filter((it) => it.standard === banks.ST.MASS_VOL && /קוביות/.test(it.prompt));
  assert.ok(cubes.length >= 5, cubes.length);
  [1, 2, 3].forEach((level) => assert.ok(cubes.some((it) => it.level === level), level));
  const g3 = banks.rowsOf('data', 'ג');
  assert.ok(g3.some((it) => it.standard === banks.ST.PICTOGRAM && it.chart && it.chart.key === 2));
  assert.ok(g3.some((it) => it.standard === banks.ST.BARCHART && it.widget === 'barchart'));
  assert.ok(g3.some((it) => it.standard === banks.ST.TABLE));
  assert.ok(banks.skillsForGrade('ג').includes('data'));
  assert.deepEqual(banks.diagnosticItems('ג').filter((it) => it.skill === 'data').map((it) => it.level), [1, 2]);
});

test('grade ג has no partial topic left, and the multiplication table row is backed by every 10×10 fact (#412)', () => {
  const banks = require('../src/lib/banks');
  assert.deepEqual(cur.summaryForGrade('ג'), { grade: 'ג', total: 9, covered: 9, partial: 0, gap: 0 });
  assert.ok(cur.rowsForGrade('ג').some((r) => /לוח כפל 10×10/.test(r.topic) && r.status === cur.COVERED));

  const facts = new Set();
  ['ב', 'ג'].forEach((g) => banks.rowsOf('multiplication', g).forEach((it) => {
    const m = /^(\d+) × (\d+) = \?$/.exec(it.prompt);
    if (!m) return;
    const a = +m[1];
    const b = +m[2];
    assert.equal(Number(it.answer), a * b, it.prompt);
    facts.add(Math.min(a, b) + '×' + Math.max(a, b));
  }));
  const missing = [];
  for (let a = 1; a <= 10; a++) for (let b = a; b <= 10; b++) if (!facts.has(a + '×' + b)) missing.push(a + '×' + b);
  assert.deepEqual(missing, []);

  const g3 = banks.rowsOf('multiplication', 'ג');
  assert.ok(g3.every((it) => it.standard === banks.ST.MUL_C));
  assert.ok(g3.some((it) => /חוק החילוף/.test(it.hint)));
  assert.ok(g3.some((it) => /חוק הפילוג/.test(it.hint)));
  assert.ok(g3.filter((it) => /^☐ × |× ☐ =/.test(it.prompt)).length >= 2);
  [1, 2, 3].forEach((level) => assert.ok(g3.some((it) => it.level === level), level));
});

test('every covered grade ג numbers topic has real bank items behind it (#412)', () => {
  const banks = require('../src/lib/banks');
  const ST = banks.ST;
  const backing = [
    [/מספרים עד 10,000/, 'place_value', null],
    [/עד רבבה/, 'addition', null],
    [/עד רבבה/, 'subtraction', null],
    [/לוח כפל/, 'multiplication', ST.MUL_C],
    [/חילוק עם שארית/, 'division', ST.MUL_DIV_10],
    [/דו־שלביות/, 'word_problems', ST.WORD_TWO_STEP],
  ];
  backing.forEach(([topic, skill, standard]) => {
    const row = cur.rowsForGrade('ג').find((r) => r.strand === 'numbers' && topic.test(r.topic));
    assert.ok(row && row.status === cur.COVERED, String(topic));
    const items = banks.rowsOf(skill, 'ג').filter((it) => !standard || it.standard === standard);
    assert.ok(items.length >= 2, skill + ' ' + String(topic));
  });
  assert.ok(banks.rowsOf('division', 'ג').some((it) => /שארית/.test(String(it.prompt) + String(it.answer))));
  assert.ok(banks.rowsOf('place_value', 'ג').some((it) => Number(String(it.answer).replace(/,/g, '')) >= 1000));
});

