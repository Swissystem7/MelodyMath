const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');

// הערות דחייה (אל תפרשו מחדש):
// 1) אין שינוי שם strand→domain / standard→clause בכל הקוד — רק aliases על פריטים
//    ו־CLOSED_DOMAINS / CLOSED_CLAUSES. החוזה נשאר {grade, strand, standard}.
// 2) «אף סעיף לא מופיע פעמיים באותה שכבה» ≠ פריט בנק אחד לכל סעיף בכיתה.
//    יש כמה פריטי תרגול לאותו סעיף בכוונה. הנכון: (א) מחרוזות ST ייחודיות;
//    (ב) (grade, clause) לא ממפה לשני תחומים — clauseDomainConflicts === [].

function printOffenders(label, list) {
  if (!list || !list.length) return;
  console.error(label + ' (' + list.length + '):');
  list.forEach(function (o) {
    console.error('  ', o.id, o.grade, o.domain, o.clause);
  });
}

test('every shipped item has grade + domain + clause aliases matching strand/standard', () => {
  const v = banks.tagViolations();
  printOffenders('missingTag', v.missingTag);
  assert.equal(v.missingTag.length, 0);
  banks.allItems().forEach(function (it) {
    assert.ok(it.grade, it.id);
    assert.ok(it.domain, it.id);
    assert.ok(it.clause, it.id);
    assert.equal(it.domain, it.strand, it.id);
    assert.equal(it.clause, it.standard, it.id);
  });
});

test('every domain/clause is inside the closed sets; print outsideClosed on failure', () => {
  const v = banks.tagViolations();
  printOffenders('outsideClosed', v.outsideClosed);
  assert.equal(v.outsideClosed.length, 0);
});

test('CLOSED_DOMAINS has 5 unique values; CLOSED_CLAUSES has 36 unique values', () => {
  assert.equal(banks.CLOSED_DOMAINS.length, 5);
  assert.equal(banks.CLOSED_CLAUSES.length, 36);
  assert.equal(new Set(banks.CLOSED_DOMAINS).size, banks.CLOSED_DOMAINS.length);
  assert.equal(new Set(banks.CLOSED_CLAUSES).size, banks.CLOSED_CLAUSES.length);
  assert.deepEqual(
    [...banks.CLOSED_DOMAINS].sort(),
    [...new Set(Object.values(banks.STRAND))].sort()
  );
  assert.deepEqual(
    [...banks.CLOSED_CLAUSES].sort(),
    [...new Set(Object.values(banks.ST))].sort()
  );
});

test('clauseDomainConflicts is empty; print offenders if not', () => {
  const v = banks.tagViolations();
  printOffenders('clauseDomainConflicts', v.clauseDomainConflicts);
  assert.equal(v.clauseDomainConflicts.length, 0);
});

test('uncoveredDomains matches hand-derived gaps by grade', () => {
  assert.deepEqual(banks.uncoveredDomains('א'), ['שברים']);
  assert.deepEqual(banks.uncoveredDomains('ב'), ['שברים']);
  assert.deepEqual(banks.uncoveredDomains('ג'), [
    'גאומטריה', 'חקר נתונים', 'מדידות', 'שברים',
  ]);
  assert.deepEqual(banks.uncoveredDomains('ד'), [
    'גאומטריה', 'חקר נתונים', 'מדידות', 'מספרים ופעולות',
  ]);
});

test('MATRIX geometry/measure/data for א/ב are covered when the bank has items', () => {
  const rows = cur.MATRIX.filter(function (r) {
    return (r.grade === 'א' || r.grade === 'ב')
      && (r.strand === 'geometry' || r.strand === 'measure' || r.strand === 'data');
  });
  rows.forEach(function (r) {
    const strandHe = cur.strandHe(r.strand);
    const n = banks.allItems().filter(function (it) {
      return it.grade === r.grade && it.strand === strandHe;
    }).length;
    assert.ok(n > 0, r.grade + ' ' + r.strand + ' should have bank items');
    assert.notEqual(
      r.status,
      'gap',
      r.grade + ' ' + r.strand + ' (' + r.topic + ') must not stay gap when bank has ' + n + ' items'
    );
  });
  assert.ok(
    cur.MATRIX.some(function (r) {
      return r.grade === 'ג' && r.strand === 'geometry' && r.status === 'gap';
    })
  );
});

test('curriculum.html drops the false footer and surfaces uncovered domains', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'curriculum.html'), 'utf8');
  assert.doesNotMatch(page, /אין כאן גאומטריה/);
  assert.match(page, /לא מכוסים|תחומים לא מכוסים/);
  assert.match(page, /uncoveredDomains/);
});
