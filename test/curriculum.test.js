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
    if (g === 'א' || g === 'ב' || g === 'ג') assert.equal(sum.gap, 0, g + ' gaps are closed');
    else assert.ok(sum.gap >= 1, 'grade ' + g + ' must show at least one honest gap');
  });
  assert.ok(rows.some((r) => r.grade === 'א' && r.status === 'covered' && /ספירה עד 100/.test(r.topic)));
  assert.ok(rows.some((r) => r.grade === 'א' && r.strand === 'geometry' && r.status === 'partial' && /אין פירוק/.test(r.note)));
  assert.ok(rows.some((r) => r.grade === 'ג' && r.strand === 'geometry' && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ד' && r.strand === 'geometry' && r.status === 'partial' && /אין חישוב שטח פנים/.test(r.note)));
  assert.ok(rows.some((r) => r.grade === 'א' && r.strand === 'measure' && r.status === 'covered' && /סרגל מצויר/.test(r.note)));
  assert.ok(rows.some((r) => r.grade === 'א' && r.strand === 'data' && r.status === 'covered' && /פיקטוגרם/.test(r.topic)));
  assert.ok(rows.some((r) => r.grade === 'ב' && r.strand === 'measure' && r.status === 'covered' && /נפח תיבות/.test(r.topic)));
  assert.ok(rows.some((r) => r.grade === 'ג' && r.strand === 'data' && r.status === 'covered' && /דיאגרמות/.test(r.topic)));
  assert.ok(rows.some((r) => r.grade === 'ג' && r.strand === 'measure' && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ד' && r.strand === 'measure' && r.status === 'partial' && /אין לוח עברי/.test(r.note)));
  assert.ok(rows.some((r) => r.grade === 'ב' && /חילוק/.test(r.topic) && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ד' && r.strand === 'fractions' && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ד' && r.status === 'gap' && /חלק מכמות/.test(r.topic)));
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

