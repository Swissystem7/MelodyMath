const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/lib/teacherStore');
const assignment = require('../src/lib/assignment');

function memory() {
  const m = Object.create(null);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
  };
}

test('assignTask adds a task to the student list and it appears in student data', () => {
  const ls = memory();
  store.upsertStudent('שילוב', 'נועה', ls);
  const row = store.assignTask('שילוב', 'נועה', { title: 'תרגול חיבור', skill: 'חיבור' }, ls);
  assert.ok(row && row.id);
  assert.equal(row.title, 'תרגול חיבור');
  assert.equal(row.completed, false);
  const student = store.getStudent('שילוב', 'נועה', ls);
  assert.equal(student.assignments.length, 1);
  assert.equal(student.assignments[0].title, 'תרגול חיבור');
  assert.deepEqual(store.listAssignments('שילוב', 'נועה', ls), student.assignments);
});

test('assignTask refuses a missing student or an empty title', () => {
  const ls = memory();
  store.upsertStudent('כ', 'יוסי', ls);
  assert.equal(store.assignTask('כ', 'אין כזה', { title: 'משימה' }, ls), null);
  assert.equal(store.assignTask('כ', 'יוסי', { skill: 'חיבור' }, ls), null);
  assert.equal(store.listAssignments('כ', 'יוסי', ls).length, 0);
});

test('assignments survive a roster reload from storage', () => {
  const ls = memory();
  store.upsertStudent('א', 'דנה', ls);
  store.assignTask('א', 'דנה', assignment.createAssignment({ title: 'מנייה' }), ls);
  const reloaded = store.loadRoster('א', ls).students['דנה'];
  assert.equal(reloaded.assignments.length, 1);
  assert.equal(reloaded.assignments[0].title, 'מנייה');
});
