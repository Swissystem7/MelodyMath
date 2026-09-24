const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cur = require('../src/lib/curriculum');

test('the coverage matrix lists every grade and leaves gaps visible', () => {
  const rows = cur.coverageMatrix();
  assert.ok(rows.length >= 20);
  ['א', 'ב', 'ג', 'ד'].forEach((g) => {
    const sum = cur.summaryForGrade(g);
    assert.ok(sum.total >= 4, g);
    assert.ok(sum.gap >= 1, 'grade ' + g + ' must show at least one honest gap');
  });
  assert.ok(rows.some((r) => r.grade === 'א' && r.status === 'covered' && /ספירה עד 100/.test(r.topic)));
  assert.ok(rows.some((r) => r.grade === 'א' && r.strand === 'geometry' && r.status === 'partial'));
  assert.ok(rows.some((r) => r.grade === 'ג' && r.strand === 'geometry' && r.status === 'gap'));
  assert.ok(rows.some((r) => r.grade === 'ב' && /חילוק/.test(r.topic) && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ד' && r.strand === 'fractions' && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ד' && r.status === 'gap' && /חלק מכמות/.test(r.topic)));
});

test('א/ב geometry, measure and data rows say only what the bank holds', () => {
  // Each Ministry topic is split into its parts. Every part has bank items -> covered;
  // some parts have none -> partial; no part has items -> gap.
  const banks = require('../src/lib/banks');
  const text = (it) => it.prompt + ' ' + it.hint;
  const std = (s) => (it) => it.standard === s;
  const unit = (u) => (it) => !!it.ruler && it.ruler.unit === u;
  const decompose = (it) => /פירוק|פרקו|הרכב/.test(text(it));
  const expect = [
    { grade: 'א', topic: /^מיון מצולעים/, parts: [std(banks.ST.GEO_SORT), (it) => /קודקוד|צלע/.test(text(it)), decompose] },
    { grade: 'א', topic: /^מדידת אורך/, parts: [unit('unit'), unit('cm')] },
    { grade: 'א', topic: /^שעון אנלוגי/, parts: [std(banks.ST.CLOCK)] },
    { grade: 'א', topic: /^דיאגרמת עמודות/, parts: [std(banks.ST.BARCHART), std(banks.ST.PICTOGRAM)] },
    { grade: 'ב', topic: /^פירוק והרכבה/, parts: [decompose, std(banks.ST.RIGHT_ANGLE)] },
    { grade: 'ב', topic: /היקף/, parts: [
      unit('cm'),
      (it) => /היקף/.test(text(it)),
      (it) => /נפח/.test(text(it)), // not תיבה: in this bank it is a musical bar (תיבה 4/4)
      (it) => /:30|וחצי|חצי שעה/.test(text(it)) || (!!it.clock && it.clock.minute === 30),
    ] },
    { grade: 'ב', topic: /^טבלה/, parts: [(it) => it.standard === banks.ST.TABLE || it.widget === 'table', std(banks.ST.BARCHART), std(banks.ST.PICTOGRAM)] },
  ];
  const nonNumber = cur.MATRIX.filter((r) => (r.grade === 'א' || r.grade === 'ב') && r.strand !== 'numbers');
  assert.equal(nonNumber.length, expect.length, 'every א/ב geometry/measure/data row is checked');
  expect.forEach((e) => {
    const row = cur.MATRIX.find((r) => r.grade === e.grade && e.topic.test(r.topic));
    assert.ok(row, e.grade + ' ' + e.topic);
    const inStrand = banks.allItems().filter((it) => it.grade === row.grade && it.strand === cur.strandHe(row.strand));
    const counts = e.parts.map((p) => inStrand.filter(p).length);
    const want = counts.every((n) => n > 0) ? 'covered' : counts.some((n) => n > 0) ? 'partial' : 'gap';
    assert.equal(row.status, want, row.grade + ' ' + row.topic + ' — bank items per part: ' + counts.join('/'));
  });
});

test('README and the bank comments match the matrix on geometry, measure and data', () => {
  const root = path.join(__dirname, '..');
  const banks = require('../src/lib/banks');
  const rows = cur.MATRIX.filter((r) => ['geometry', 'measure', 'data'].includes(r.strand));
  const line = fs.readFileSync(path.join(root, 'README.md'), 'utf8').split('\n').find((l) => l.startsWith('[דף הכיסוי]'));
  assert.ok(line, 'README has the coverage-page paragraph');
  assert.ok(rows.some((r) => r.status !== cur.GAP));
  assert.doesNotMatch(line, /גאומטריה, מדידה וחקר נתונים — \*\*לא מכוסים\*\*\./, 'README says none of these strands is covered');
  assert.match(line, /חלקיים/);
  ['פירוק והרכבה', 'היקף', 'נפח', 'חצאי שעות', 'טבלה'].forEach((part) => assert.ok(line.includes(part), 'README names the missing part ' + part));
  const allGap = cur.grades().filter((g) => rows.filter((r) => r.grade === g).every((r) => r.status === cur.GAP));
  if (allGap.length) assert.match(line, /\*\*לא מכוסים\*\*/, 'grades ' + allGap.join(', ') + ' have no geometry/measure/data items');
  const tableItems = banks.allItems().filter((it) => it.standard === banks.ST.TABLE || it.widget === 'table').length;
  const header = fs.readFileSync(path.join(root, 'src', 'lib', 'banks.js'), 'utf8').split('\n').find((l) => l.includes('כיתה ב׳ · נתונים'));
  assert.ok(header, 'banks.js has a grade ב data section');
  if (tableItems === 0) assert.doesNotMatch(header, /וטבלה/, 'the ב data section announces a table, but the bank has no table item');
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
