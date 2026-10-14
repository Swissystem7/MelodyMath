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

test('listStudentProgress shows each assigned task with completed status', () => {
  const ls = memory();
  store.upsertStudent('שילוב', 'נועה', ls);
  const open = store.assignTask('שילוב', 'נועה', { title: 'חיבור', skill: 'חיבור' }, ls);
  const done = store.assignTask('שילוב', 'נועה', { title: 'חיסור', completed: true, completedAt: 900 }, ls);
  assert.ok(open && done);

  const progress = store.listStudentProgress('שילוב', 'נועה', ls);
  assert.equal(progress.length, 2);
  assert.deepEqual(
    progress.map((row) => ({ title: row.title, completed: row.completed })),
    [{ title: 'חיבור', completed: false }, { title: 'חיסור', completed: true }],
  );

  progress.forEach((row, i) => {
    const raw = store.getStudent('שילוב', 'נועה', ls).assignments[i];
    assert.equal(row.id, raw.id);
    assert.equal(row.title, raw.title);
    assert.equal(row.skill, raw.skill);
    assert.equal(row.completed, !!raw.completed);
    if (row.completed) assert.equal(row.completedAt, raw.completedAt);
    else assert.equal(row.completedAt, null);
  });
});

test('listStudentProgress returns null for a missing student and cleans bad rows', () => {
  const ls = memory();
  assert.equal(store.listStudentProgress('שילוב', 'אין', ls), null);

  store.upsertStudent('שילוב', 'רון', ls);
  const roster = store.loadRoster('שילוב', ls);
  roster.students['רון'].assignments = [
    { id: 't1', title: 'תקין', completed: false },
    { skill: 'חיבור' },
    { id: 't1', title: 'כפול' },
    null,
  ];
  store.saveRoster('שילוב', roster, ls);

  const progress = store.listStudentProgress('שילוב', 'רון', ls);
  assert.equal(progress.length, 1);
  assert.equal(progress[0].title, 'תקין');
  assert.equal(progress[0].completed, false);
});

test('listClassStudentsProgress lists students in Hebrew order with task status', () => {
  const ls = memory();
  store.upsertStudent('שילוב', 'דנה', ls);
  store.upsertStudent('שילוב', 'אבי', ls);
  store.assignTask('שילוב', 'אבי', { title: 'משימה א' }, ls);
  store.assignTask('שילוב', 'דנה', { title: 'משימה ב', completed: true }, ls);
  store.assignTask('שילוב', 'דנה', { title: 'משימה ג' }, ls);

  const rows = store.listClassStudentsProgress('שילוב', ls);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => r.name), ['אבי', 'דנה']);

  const avi = rows[0];
  assert.equal(avi.totalCount, 1);
  assert.equal(avi.completedCount, 0);
  assert.deepEqual(avi.tasks.map((t) => t.completed), [false]);

  const dana = rows[1];
  assert.equal(dana.totalCount, 2);
  assert.equal(dana.completedCount, 1);
  assert.deepEqual(
    dana.tasks.map((t) => ({ title: t.title, completed: t.completed })),
    [{ title: 'משימה ב', completed: true }, { title: 'משימה ג', completed: false }],
  );

  assert.deepEqual(store.listClassStudentsProgress('כיתה ריקה', ls), []);
});
