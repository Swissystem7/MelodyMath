// A teacher assigns tasks on one school tablet and moves the roster JSON to
// another. The tasks have to ride along like the notes do: a student who
// already exists on the second tablet must not silently lose them, and a
// hand-edited file must not plant rows that are not assignments at all.
const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/lib/teacherStore');

function memory() {
  const m = Object.create(null);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
  };
}

function sourceJson() {
  const src = memory();
  store.upsertStudent('שילוב', 'תמר', src);
  assert.ok(store.assignTask('שילוב', 'תמר', { title: 'תרגול חיבור', skill: 'חיבור' }, src));
  assert.ok(store.assignTask('שילוב', 'תמר', { title: 'מנייה עד 20', skill: 'מנייה' }, src));
  return store.exportRoster('שילוב', src);
}

test('import into an empty tablet keeps the assigned tasks', () => {
  const dest = memory();
  const res = store.importRoster('שילוב', sourceJson(), dest);
  assert.equal(res.ok, true);
  assert.equal(res.added, 1);
  assert.equal(res.assignments, 2);
  const tasks = store.listAssignments('שילוב', 'תמר', dest);
  assert.deepEqual(tasks.map((t) => t.title), ['תרגול חיבור', 'מנייה עד 20']);
});

test('import onto a tablet that already has the student merges new tasks by id', () => {
  const dest = memory();
  store.upsertStudent('שילוב', 'תמר', dest);
  const local = store.assignTask('שילוב', 'תמר', { title: 'שעון', skill: 'זמן' }, dest);
  const res = store.importRoster('שילוב', sourceJson(), dest);
  assert.equal(res.ok, true);
  assert.equal(res.added, 0);
  assert.equal(res.assignments, 2);
  const tasks = store.listAssignments('שילוב', 'תמר', dest);
  assert.equal(tasks.length, 3);
  assert.equal(tasks[0].id, local.id);
  assert.deepEqual(tasks.slice(1).map((t) => t.title), ['תרגול חיבור', 'מנייה עד 20']);
});

test('importing the same file twice does not duplicate tasks', () => {
  const json = sourceJson();
  const dest = memory();
  store.importRoster('שילוב', json, dest);
  const again = store.importRoster('שילוב', json, dest);
  assert.equal(again.ok, true);
  assert.equal(again.assignments, 0);
  assert.equal(store.listAssignments('שילוב', 'תמר', dest).length, 2);
});

test('a task completed on this tablet is not reset by a stale export', () => {
  const json = sourceJson();
  const dest = memory();
  store.importRoster('שילוב', json, dest);
  const roster = store.loadRoster('שילוב', dest);
  roster.students['תמר'].assignments[0].completed = true;
  roster.students['תמר'].assignments[0].completedAt = 123;
  store.saveRoster('שילוב', roster, dest);
  store.importRoster('שילוב', json, dest);
  const tasks = store.listAssignments('שילוב', 'תמר', dest);
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].completed, true);
  assert.equal(tasks[0].completedAt, 123);
});

test('rows that are not assignments are dropped on import', () => {
  const dest = memory();
  const res = store.importRoster('שילוב', {
    students: {
      'דני': {
        sessions: [],
        assignments: [
          'just a string',
          null,
          { skill: 'חיבור' },
          { id: 'x1', title: '  שבר   פשוט  ', skill: 'שברים' },
          { id: 'x1', title: 'כפילות של אותו מזהה' },
        ],
      },
      'נועה': { sessions: [], assignments: 'not-a-list' },
    },
  }, dest);
  assert.equal(res.ok, true);
  assert.equal(res.added, 2);
  assert.equal(res.assignments, 1);
  const tasks = store.listAssignments('שילוב', 'דני', dest);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].id, 'x1');
  assert.equal(tasks[0].title, 'שבר פשוט');
  assert.deepEqual(store.listAssignments('שילוב', 'נועה', dest), []);
});
