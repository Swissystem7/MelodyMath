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
  assert.ok(rows.some((r) => r.grade === 'א' && r.strand === 'geometry' && r.status === 'gap'));
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
