// The class board's "last activity" column must name the student's most
// recent session. buildClassOverview and getDashboardData used to take the
// last entry of the sessions array. Sessions are stored in arrival order and
// importRoster appends the other tablet's rows after the local ones, so after
// a roster import the board showed an older session (its time and its kind)
// as the latest and the teacher saw the wrong date for a student she had
// just worked with. The latest start time must win, whatever the order.
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

function session(id, kind, started) {
  return { id, kind, started, ended: started + 100, items: [{ skill: 'חיבור', prompt: '1+1', answer: 2, given: 2, correct: true }] };
}

function rosterWith(sessions) {
  return JSON.stringify({ v: 1, classCode: 'שילוב', students: { 'נועה': { name: 'נועה', created: 1, sessions, assignments: [] } } });
}

test('an imported older session does not replace the local newer one as last activity', () => {
  const ls = memory();
  ls.setItem(store.storageKey('שילוב'), rosterWith([session('local-new', 'class', 5000)]));
  const res = store.importRoster('שילוב', rosterWith([session('other-old', 'diag', 1000)]), ls);
  assert.equal(res.ok, true);
  assert.equal(res.merged, 1);
  // Arrival order is still local first, imported second.
  const stored = store.getStudent('שילוב', 'נועה', ls);
  assert.deepEqual(stored.sessions.map((s) => s.id), ['local-new', 'other-old']);
  const row = store.buildClassOverview('שילוב', ls)[0];
  assert.equal(row.lastAt, 5000);
  assert.equal(row.lastKind, 'class');
  assert.equal(row.sessions, 2);
  const dash = store.getDashboardData('שילוב', ls)[0];
  assert.equal(dash.lastAt, 5000);
  assert.equal(dash.lastKind, 'class');
});

test('an imported newer session becomes the last activity', () => {
  const ls = memory();
  ls.setItem(store.storageKey('שילוב'), rosterWith([session('local-old', 'practice', 1000)]));
  store.importRoster('שילוב', rosterWith([session('other-new', 'beat', 9000)]), ls);
  const row = store.buildClassOverview('שילוב', ls)[0];
  assert.equal(row.lastAt, 9000);
  assert.equal(row.lastKind, 'beat');
});

test('sessions without a usable start time fall back to array order', () => {
  const ls = memory();
  const rows = [
    { id: 'a', kind: 'diag', items: [] },
    { id: 'b', kind: 'plan', started: 'soon', items: [] },
  ];
  ls.setItem(store.storageKey('שילוב'), rosterWith(rows));
  const row = store.buildClassOverview('שילוב', ls)[0];
  assert.equal(row.lastKind, 'plan');
  assert.equal(row.lastAt, 'soon');
  const dash = store.getDashboardData(rosterWith(rows))[0];
  assert.equal(dash.lastKind, 'plan');
});

test('a student with no sessions still reports no last activity', () => {
  const ls = memory();
  store.upsertStudent('שילוב', 'תמר', ls);
  const row = store.buildClassOverview('שילוב', ls)[0];
  assert.equal(row.lastAt, null);
  assert.equal(row.lastKind, '');
  assert.equal(row.sessions, 0);
});

test('live sessions on one tablet keep the newest as last activity', () => {
  const ls = memory();
  const a = store.startSession('שילוב', 'יוסי', 'diag', ls);
  store.endSession('שילוב', 'יוסי', a.id, ls);
  const b = store.startSession('שילוב', 'יוסי', 'class', ls);
  store.addItem('שילוב', 'יוסי', b.id, { skill: 'חיסור', prompt: '7-3', correct: false }, ls);
  const row = store.buildClassOverview('שילוב', ls)[0];
  assert.equal(row.lastKind, 'class');
  assert.equal(row.lastAt, b.started);
});
