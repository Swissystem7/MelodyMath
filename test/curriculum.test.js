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
    assert.ok(sum.gap >= 1, 'grade ' + g + ' must show at least one honest gap');
  });
  assert.ok(rows.some((r) => r.grade === 'א' && r.status === 'covered' && /ספירה עד 100/.test(r.topic)));
  assert.ok(rows.some((r) => r.grade === 'א' && r.strand === 'geometry' && r.status === 'gap'));
  assert.ok(rows.some((r) => r.grade === 'ב' && /חילוק/.test(r.topic) && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ד' && r.strand === 'fractions' && r.status === 'covered'));
  assert.ok(rows.some((r) => r.grade === 'ד' && r.status === 'gap' && /חלק מכמות/.test(r.topic)));
});

// Every topic header Newprogramgrade5.pdf and Newprogramgrade6.pdf name, as
// recorded in docs/CURRICULUM-MUSIC-PLAN.md §2 and §5. A header missing from
// the matrix is a silent omission, which is exactly what this page is for.
const UPPER_HEADERS = [
  { grade: 'ה', strand: 'numbers', re: /ראשוניים/ },
  { grade: 'ה', strand: 'numbers', re: /סימני התחלקות/ },
  { grade: 'ה', strand: 'fractions', re: /הרחבה/ },
  { grade: 'ה', strand: 'fractions', re: /צמצום/ },
  { grade: 'ה', strand: 'fractions', re: /מכנים שונים/ },
  { grade: 'ה', strand: 'fractions', re: /שברים עשרוניים/ },
  { grade: 'ה', strand: 'geometry', re: /משולש/ },
  { grade: 'ה', strand: 'geometry', re: /מקבילית/ },
  { grade: 'ה', strand: 'geometry', re: /גובה/ },
  { grade: 'ה', strand: 'data', re: /דיאגרמות/ },
  { grade: 'ו', strand: 'numbers', re: /טבעיים/ },
  { grade: 'ו', strand: 'numbers', re: /סדר פעולות/ },
  { grade: 'ו', strand: 'fractions', re: /כפל וחילוק שברים/ },
  { grade: 'ו', strand: 'fractions', re: /שברים עשרוניים/ },
  { grade: 'ו', strand: 'fractions', re: /אחוזים/ },
  { grade: 'ו', strand: 'geometry', re: /מצולעים מורכבים/ },
  { grade: 'ו', strand: 'geometry', re: /מעגל ועיגול/ },
  { grade: 'ו', strand: 'measure', re: /נפח/ },
  { grade: 'ו', strand: 'data', re: /ממוצע/ },
];

test('grades() reaches ו׳ so the page renders the whole א׳–ו׳ programme', () => {
  assert.deepEqual(cur.grades(), ['א', 'ב', 'ג', 'ד', 'ה', 'ו']);
});

test('every ה׳/ו׳ topic header from the Ministry PDFs has a row', () => {
  const rows = cur.coverageMatrix();
  UPPER_HEADERS.forEach((h) => {
    const hit = rows.filter((r) => r.grade === h.grade && r.strand === h.strand && h.re.test(r.topic));
    assert.ok(hit.length >= 1, 'no כיתה ' + h.grade + '׳ ' + h.strand + ' row matches ' + h.re);
  });
});

test('nothing in ה׳–ו׳ is claimed as covered, because no bank ships for them', () => {
  const banks = require('../src/lib/banks');
  ['ה', 'ו'].forEach((g) => {
    assert.equal(banks.itemsForGrade(g).length, 0, 'כיתה ' + g + '׳ unexpectedly has bank items');
    const sum = cur.summaryForGrade(g);
    assert.ok(sum.total >= 5, 'כיתה ' + g + '׳ needs its programme listed, got ' + sum.total);
    assert.equal(sum.covered, 0, 'כיתה ' + g + '׳ must not claim covered topics');
    assert.equal(sum.partial, 0, 'כיתה ' + g + '׳ must not claim partial topics');
    assert.equal(sum.gap, sum.total);
    assert.equal(cur.gapTopicsForGrade(g).length, sum.total);
  });
});

test('every matrix row carries a grade, a known strand, a status and a note', () => {
  const statuses = [cur.COVERED, cur.PARTIAL, cur.GAP];
  cur.MATRIX.forEach((r) => {
    assert.ok(cur.grades().indexOf(r.grade) !== -1, 'unknown grade ' + r.grade);
    assert.ok(Object.prototype.hasOwnProperty.call(cur.STRAND_HE, r.strand), 'unknown strand ' + r.strand);
    assert.ok(statuses.indexOf(r.status) !== -1, 'unknown status ' + r.status);
    assert.ok(r.topic && r.topic.trim().length >= 3, 'empty topic: ' + JSON.stringify(r.topic));
    assert.ok(r.note && r.note.length > 2, 'row without a note: ' + r.topic);
  });
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
