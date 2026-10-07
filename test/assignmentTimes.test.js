const test = require('node:test');
const assert = require('node:assert/strict');
const assignment = require('../src/lib/assignment');
const store = require('../src/lib/teacherStore');

function memory() {
  const m = Object.create(null);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
  };
}

const YEAR_2000 = Date.UTC(2000, 0, 1);

test('a missing assignedAt is stamped now, not 1.1.1970', () => {
  const before = Date.now();
  [undefined, null, '', '  ', true, false, [], {}, 'abc', NaN, Infinity].forEach((v) => {
    const row = assignment.normalizeAssignment({ title: 'משימה', assignedAt: v });
    assert.ok(row.assignedAt >= before, 'assignedAt for ' + JSON.stringify(v) + ' is ' + row.assignedAt);
  });
});

test('a numeric assignedAt is kept, also as a numeric string', () => {
  assert.equal(assignment.normalizeAssignment({ title: 'א', assignedAt: 123456 }).assignedAt, 123456);
  assert.equal(assignment.normalizeAssignment({ title: 'א', assignedAt: '123456' }).assignedAt, 123456);
  assert.equal(assignment.normalizeAssignment({ title: 'א', assignedAt: 0 }).assignedAt, 0);
});

test('a completed task with no usable completedAt keeps null instead of 1970', () => {
  [null, '', true, [], 'x'].forEach((v) => {
    const row = assignment.normalizeAssignment({ title: 'משימה', completed: true, completedAt: v });
    assert.equal(row.completedAt, null, 'completedAt for ' + JSON.stringify(v));
  });
  const kept = assignment.normalizeAssignment({ title: 'משימה', completed: true, completedAt: YEAR_2000 });
  assert.equal(kept.completedAt, YEAR_2000);
  const open = assignment.normalizeAssignment({ title: 'משימה', completed: false, completedAt: YEAR_2000 });
  assert.equal(open.completedAt, null);
});

test('an object or blank id gets a generated id, a number id is kept as text', () => {
  const a = assignment.normalizeAssignment({ title: 'א', id: {} });
  const b = assignment.normalizeAssignment({ title: 'ב', id: ['x'] });
  const c = assignment.normalizeAssignment({ title: 'ג', id: '   ' });
  [a, b, c].forEach((row) => {
    assert.match(row.id, /^a[0-9a-z]+$/);
    assert.notEqual(row.id, '[object Object]');
  });
  assert.notEqual(a.id, b.id);
  assert.equal(assignment.normalizeAssignment({ title: 'ד', id: 7 }).id, '7');
  assert.equal(assignment.normalizeAssignment({ title: 'ה', id: ' t1 ' }).id, 't1');
});

test('importRoster keeps two tasks whose ids are objects instead of folding them into one', () => {
  const ls = memory();
  store.upsertStudent('שילוב', 'נועה', ls);
  const roster = store.loadRoster('שילוב', ls);
  roster.students['נועה'].assignments = [
    { id: {}, title: 'חיבור', assignedAt: null },
    { id: {}, title: 'חיסור', assignedAt: '' },
  ];
  const before = Date.now();
  store.importRoster('שילוב', JSON.stringify(roster), ls);
  const tasks = store.listAssignments('שילוב', 'נועה', ls);
  assert.equal(tasks.length, 2);
  assert.notEqual(tasks[0].id, tasks[1].id);
  tasks.forEach((t) => assert.ok(t.assignedAt >= before));
});
