const test = require('node:test');
const assert = require('node:assert/strict');
const demo = require('../tools/demo-diagnosis-plan');
const banks = require('../src/lib/banks');
const store = require('../src/lib/teacherStore');

test('default demo: ג׳ misses in כפל/חילוק give a weak-branch plan on לוח כפל, kept in storage', () => {
  const storage = demo.memoryStorage();
  const r = demo.runDemo({ storage });
  assert.equal(r.pass, true, JSON.stringify(r.checks));
  assert.equal(r.plan.branch, 'weak');
  assert.match(r.plan.topic, /לוח כפל/);
  assert.ok(r.wrong > 0 && r.wrong < r.answered);
  const raw = storage.getItem(r.storageKey);
  assert.ok(raw, 'plan not written under ' + r.storageKey);
  assert.equal(JSON.parse(raw).topic, r.plan.topic);
  assert.ok(storage.getItem(store.storageKey(r.classCode)), 'roster not written');
});

test('every diagnosed skill in every grade, missed alone, lands on a playable curriculum topic', () => {
  banks.GRADES.forEach((grade) => {
    banks.GRADE_SKILLS[grade].forEach((skill) => {
      const r = demo.runDemo({ grade, miss: [skill] });
      assert.equal(r.pass, true, grade + ' ' + skill + ' ' + JSON.stringify(r.checks));
      assert.ok(r.curriculumRow && r.curriculumRow.topic === r.plan.topic);
    });
  });
});

test('a diagnostic with no mistakes is not reported as a pass', () => {
  const r = demo.runDemo({ grade: 'ב', miss: [] });
  assert.equal(r.checks.diagnosticHasMistakes, false);
  assert.equal(r.pass, false);
});

test('report prints one PASS/FAIL line per check', () => {
  const r = demo.runDemo({});
  const text = demo.report(r);
  Object.keys(r.checks).forEach((k) => assert.match(text, new RegExp('PASS ' + k)));
  assert.match(text, /OK$/);
});
