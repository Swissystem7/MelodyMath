// #361: server-side checks for the 21.10 demo — every א׳–ג׳ row the coverage
// page calls covered (or partial) is reached by real bank items, and the
// personal-plan demo and the g1 widget stay wired.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cur = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');

function itemsPerRow(grade) {
  const hits = {};
  banks.itemsForGrade(grade).forEach((it) => {
    const s = cur.sectionForItem(it);
    if (s && s.topic) hits[s.topic] = (hits[s.topic] || 0) + 1;
  });
  return hits;
}

test('א׳–ג׳ have no gap row, and every covered or partial row has bank items tagged to it', () => {
  ['א', 'ב', 'ג'].forEach((grade) => {
    assert.equal(cur.summaryForGrade(grade).gap, 0, grade);
    const hits = itemsPerRow(grade);
    const empty = cur.rowsForGrade(grade)
      .filter((r) => r.status !== cur.GAP && !hits[r.topic])
      .map((r) => grade + ': ' + r.topic);
    assert.deepEqual(empty, []);
  });
});

test('grade ב׳ cube items carry the «נפח תיבות» tag, not «לא אומת»', () => {
  const cubes = banks.rowsOf('measurement', 'ב').filter((it) => /קוביות/.test(it.prompt));
  assert.ok(cubes.length >= 5, cubes.length);
  cubes.forEach((it) => {
    const s = cur.sectionForItem(it);
    assert.match(s.topic || '', /^נפח תיבות/, it.prompt);
    assert.equal(s.verified, true, it.prompt);
  });
});

test('demo diagnosis with mistakes in א׳, ב׳ and ג׳ saves a one-topic personal plan', () => {
  const demo = require('../tools/demo-diagnosis-plan');
  ['א', 'ב', 'ג'].forEach((grade) => {
    const storage = demo.memoryStorage();
    const miss = banks.GRADE_SKILLS[grade].slice(0, 2);
    const r = demo.runDemo({ grade, miss, storage });
    assert.equal(r.pass, true, grade + ' ' + JSON.stringify(r.checks));
    assert.ok(r.plan && r.plan.topic, grade);
    assert.equal(JSON.parse(storage.getItem(r.storageKey)).topic, r.plan.topic, grade);
  });
});

test('the g1 widget (#327) is loaded by index.html and backed by grade א items', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.includes('<script src="src/lib/grade1Music.js"></script>'));
  assert.match(html, /item\.widget==='g1'/);
  assert.ok(banks.itemsForGrade('א').some((it) => it.widget === 'g1' && it.g1));
});
