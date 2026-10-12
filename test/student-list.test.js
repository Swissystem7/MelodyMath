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

test('listClassStudents shows the teacher roster in Hebrew order with accurate rows', () => {
  const ls = memory();
  store.upsertStudent('שילוב', 'דנה', ls);
  store.upsertStudent('שילוב', 'אבי', ls);
  store.upsertStudent('שילוב ב', 'אבי', ls);

  const list = store.listClassStudents('שילוב', ls);
  assert.equal(list.length, 2);
  assert.deepEqual(list.map((row) => row.name), ['אבי', 'דנה']);

  list.forEach((row) => {
    const student = store.getStudent('שילוב', row.name, ls);
    assert.ok(student);
    assert.equal(row.name, student.name);
    assert.equal(row.created, student.created);
  });

  assert.deepEqual(store.listClassStudents('כיתה ריקה', ls), []);
});

test('listClassStudents drops invalid roster rows like listStudents does', () => {
  const ls = memory();
  ls.setItem(
    store.storageKey('שילוב'),
    '{"classCode":"שילוב","students":{"__proto__":{"sessions":[]},"רון":{"name":"רון","created":42,"sessions":[]},"broken":null}}',
  );
  const list = store.listClassStudents('שילוב', ls);
  assert.equal(list.length, 1);
  assert.equal(list[0].name, 'רון');
  assert.equal(list[0].created, 42);
});
