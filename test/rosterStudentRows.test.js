// roster.students[name] must always be the object upsertStudent writes. A
// hand-edited or truncated export, or a roster saved by a build that did
// not check, can leave a student row as null, a bare string, a number or an
// array. Before this fix loadRoster kept such rows, so buildClassOverview
// threw on `null.sessions` for the WHOLE class, startSession threw from
// `target.sessions.push` for that student, and importRoster threw while
// merging into the row. The readers must drop such rows, and the import
// must count them as skipped so the teacher sees they were dropped.
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

const goodRow = {
  name: 'תמר', created: 1, assignments: [],
  sessions: [{ id: 's1', kind: 'practice', started: 1000, ended: 2000,
    items: [{ skill: 'חיבור', prompt: '1+1', answer: 2, given: 2, correct: true }] }],
};

function brokenStudents() {
  return { 'דנה': null, 'יוסי': 'junk', 'רון': 7, 'גל': ['not', 'a', 'student'], 'תמר': goodRow };
}

function seeded() {
  const ls = memory();
  ls.setItem(store.storageKey('שילוב'), JSON.stringify({ classCode: 'שילוב', students: brokenStudents() }));
  return ls;
}

test('loadRoster drops student rows that are not objects', () => {
  const ls = seeded();
  assert.deepEqual(store.listStudents('שילוב', ls), ['תמר']);
  assert.equal(store.getStudent('שילוב', 'דנה', ls), null);
  assert.equal(store.getStudent('שילוב', 'יוסי', ls), null);
  assert.equal(store.getStudent('שילוב', 'גל', ls), null);
  assert.ok(store.getStudent('שילוב', 'תמר', ls));
});

test('the class board and dashboard render when the stored roster holds a broken row', () => {
  const ls = seeded();
  let board;
  assert.doesNotThrow(() => { board = store.buildClassOverview('שילוב', ls); });
  assert.equal(board.length, 1);
  assert.equal(board[0].name, 'תמר');
  assert.equal(board[0].total, 1);
  const dash = store.getDashboardData('שילוב', ls);
  assert.equal(dash.length, 1);
});

test('the practice loop starts a fresh row for a student whose stored row was broken', () => {
  const ls = seeded();
  let sess;
  assert.doesNotThrow(() => { sess = store.startSession('שילוב', 'יוסי', 'practice', ls); });
  assert.ok(sess && sess.id);
  const row = store.addItem('שילוב', 'יוסי', sess.id, { skill: 'חיסור', prompt: '3-1', answer: 2, given: 2, correct: true }, ls);
  assert.ok(row);
  assert.ok(store.endSession('שילוב', 'יוסי', sess.id, ls));
  const kid = store.getStudent('שילוב', 'יוסי', ls);
  assert.equal(kid.sessions.length, 1);
  assert.equal(kid.sessions[0].items.length, 1);
  assert.deepEqual(store.listStudents('שילוב', ls), ['יוסי', 'תמר']);
});

test('notes and tasks can be written for a student whose stored row was a string', () => {
  const ls = seeded();
  store.upsertStudent('שילוב', 'יוסי', ls);
  assert.ok(store.addNote('שילוב', 'יוסי', 'התחיל מחדש', ls));
  assert.equal(store.listNotes(store.getStudent('שילוב', 'יוסי', ls)).length, 1);
});

test('importRoster counts non-object student rows as skipped and keeps the good one', () => {
  const dst = memory();
  const res = store.importRoster('שילוב', JSON.stringify({ v: 1, classCode: 'שילוב', students: brokenStudents() }), dst);
  assert.equal(res.ok, true);
  assert.equal(res.added, 1);
  assert.equal(res.skipped, 4);
  assert.deepEqual(store.listStudents('שילוב', dst), ['תמר']);
  assert.equal(store.summarizeImport(res), 'יובא: 1 תלמידים חדשים. 4 שורות לא תקינות (שם או מבנה) לא יובאו.');
});

test('importRoster merges into a device roster that already holds a broken row', () => {
  const ls = seeded();
  const file = { v: 1, classCode: 'שילוב', students: {
    'דנה': { name: 'דנה', created: 5, sessions: [{ id: 'd1', kind: 'diag', started: 10, ended: 20, items: [] }], assignments: [], notes: [] },
    'תמר': { name: 'תמר', created: 1, sessions: [{ id: 's2', kind: 'class', started: 3000, ended: 3100, items: [] }], assignments: [], notes: [] },
  } };
  let res;
  assert.doesNotThrow(() => { res = store.importRoster('שילוב', JSON.stringify(file), ls); });
  assert.equal(res.ok, true);
  assert.equal(res.added, 1, 'דנה replaces the null row as a new student');
  assert.equal(res.merged, 1, 'תמר gets the one new session');
  assert.equal(res.skipped, 0);
  assert.deepEqual(store.listStudents('שילוב', ls), ['דנה', 'תמר']);
  assert.equal(store.getStudent('שילוב', 'תמר', ls).sessions.length, 2);
});
