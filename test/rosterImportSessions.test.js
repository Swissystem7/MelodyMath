// A roster JSON that was hand-edited, truncated or produced by an older
// build can carry a session entry that is not an object (null, a string) or
// a session whose `items` is not a list. Before this fix importRoster stored
// such rows as-is for a new student, and from then on the class board, the
// student report and the practice loop (addItem / endSession) all threw on
// `null.items` / `null.id` for that student, on every visit, until the
// teacher cleared the device. The import must drop the unusable rows and the
// readers must survive a row that is already on the device.
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

const goodSession = {
  id: 's-good', kind: 'practice', started: 1000, ended: 2000,
  items: [{ skill: 'חיבור', prompt: '1+1', answer: 2, given: 2, correct: true }],
};

function brokenFile() {
  return JSON.stringify({
    v: 1,
    classCode: 'שילוב',
    students: {
      'דנה': {
        name: 'דנה',
        created: 1,
        sessions: [
          null,
          'junk',
          42,
          ['not', 'a', 'session'],
          goodSession,
          { id: 's-good', kind: 'practice', started: 1000, items: [] },
          { id: 's-noitems', kind: 'diag', started: 3000, ended: 3100, items: null },
          { id: 's-baditems', kind: 'practice', started: 4000, items: [null, { skill: 'חיסור', prompt: '3-1', answer: 2, given: 1, correct: false }] },
        ],
      },
    },
  });
}

test('import drops session rows that are not objects and repairs items', () => {
  const dest = memory();
  const res = store.importRoster('שילוב', brokenFile(), dest);
  assert.equal(res.ok, true);
  assert.equal(res.added, 1);
  const kid = store.getStudent('שילוב', 'דנה', dest);
  assert.deepEqual(kid.sessions.map((s) => s.id), ['s-good', 's-noitems', 's-baditems']);
  kid.sessions.forEach((s) => assert.ok(Array.isArray(s.items), s.id + ' has an items list'));
  assert.equal(kid.sessions[2].items.length, 1, 'a null item inside a session is dropped');
});

test('class board, dashboard and report work after importing a broken file', () => {
  const dest = memory();
  store.importRoster('שילוב', brokenFile(), dest);
  const board = store.buildClassOverview('שילוב', dest);
  assert.equal(board.length, 1);
  assert.equal(board[0].sessions, 3);
  assert.equal(board[0].total, 2);
  assert.equal(board[0].correct, 1);
  const dash = store.getDashboardData('שילוב', dest);
  assert.equal(dash[0].sessionsCount, 3);
  const report = store.buildReport(store.getStudent('שילוב', 'דנה', dest));
  assert.equal(report.total, 2);
  assert.equal(report.sessions.length, 3);
});

test('the practice loop keeps running for a student who came from a broken file', () => {
  const dest = memory();
  store.importRoster('שילוב', brokenFile(), dest);
  const session = store.startSession('שילוב', 'דנה', 'practice', dest);
  assert.ok(session && session.id);
  const row = store.addItem('שילוב', 'דנה', session.id, { skill: 'חיבור', prompt: '2+2', answer: 4, given: 4, correct: true }, dest);
  assert.equal(row.correct, true);
  assert.ok(store.endSession('שילוב', 'דנה', session.id, dest).ended);
  assert.equal(store.buildReport(store.getStudent('שילוב', 'דנה', dest)).total, 3);
});

test('readers survive a broken row that is already stored on the device', () => {
  // Data written by a build before this fix: no import step to clean it.
  const ls = memory();
  ls.setItem(store.storageKey('שילוב'), JSON.stringify({
    classCode: 'שילוב',
    students: {
      'רון': { name: 'רון', sessions: [null, { id: 'x', kind: 'practice', started: 1, items: null }, goodSession] },
    },
  }));
  assert.equal(store.buildClassOverview('שילוב', ls)[0].total, 1);
  assert.equal(store.buildReport(store.getStudent('שילוב', 'רון', ls)).sessions.length, 2);
  const row = store.addItem('שילוב', 'רון', 'x', { skill: 'a', prompt: 'p', answer: 1, given: 1, correct: true }, ls);
  assert.equal(row.correct, true);
  assert.ok(store.endSession('שילוב', 'רון', 'x', ls).ended);
  const s = store.startSession('שילוב', 'רון', 'diag', ls);
  assert.ok(store.addItem('שילוב', 'רון', s.id, { skill: 'a', prompt: 'q', answer: 1, given: 2, correct: false }, ls));
});

test('merging into an existing student still skips rows without an id', () => {
  const dest = memory();
  store.upsertStudent('שילוב', 'דנה', dest);
  const res = store.importRoster('שילוב', brokenFile(), dest);
  assert.equal(res.ok, true);
  assert.equal(res.merged, 3);
  assert.equal(store.getStudent('שילוב', 'דנה', dest).sessions.length, 3);
  assert.doesNotThrow(() => store.buildClassOverview('שילוב', dest));
});
