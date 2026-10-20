// Issue #494: several students use MelodyMath at once and no one's answers
// land in another child's row. There is no server: "at once" means either
// many students on one shared tablet (interleaved writes to the same
// localStorage, one tab or several) or one tablet per student whose JSON
// exports the teacher imports into one roster. This is the 20-user smoke
// test for both, and it runs with `npm test`.
const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/lib/teacherStore');

const USERS = 20;
const ROUNDS = 6;

function memory() {
  const m = Object.create(null);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
    keys: () => Object.keys(m),
  };
}

// Twenty students over two class codes; two share a name across classes so
// a mix-up between classes would show.
function students() {
  const out = [];
  for (let i = 0; i < USERS; i++) {
    out.push({ classCode: i % 2 ? 'שילוב-ב' : 'שילוב-א', name: i < 2 ? 'נועה' : 'תלמיד ' + i, i: i });
  }
  return out;
}

// Each student answers a prompt only they get, so any item in the wrong row
// names its owner.
function itemFor(kid, round) {
  return {
    skill: 'חיבור',
    prompt: kid.classCode + '/' + kid.name + '#' + round,
    answer: round,
    given: round + (round % 3 === 0 ? 1 : 0),
    correct: round % 3 !== 0,
  };
}

function expectedCorrect() {
  let n = 0;
  for (let r = 0; r < ROUNDS; r++) if (r % 3 !== 0) n += 1;
  return n;
}

function assertOwnRowsOnly(kid, student) {
  assert.ok(student, kid.classCode + '/' + kid.name + ' is missing');
  const items = store.allItems(student);
  assert.equal(items.length, ROUNDS, kid.name + ' has ' + items.length + ' items');
  items.forEach((it) => {
    assert.ok(it.prompt.startsWith(kid.classCode + '/' + kid.name + '#'), kid.name + ' got ' + it.prompt);
  });
  const report = store.buildReport(student);
  assert.equal(report.correct, expectedCorrect());
}

test('20 students on one tablet, interleaved answer by answer, keep separate rows', () => {
  const ls = memory();
  const kids = students();
  // Every student "tab" holds its own who + open session, like index.html.
  const tabs = kids.map((kid) => ({ kid: kid, sess: store.startSession(kid.classCode, kid.name, 'class', ls) }));
  tabs.forEach((t) => assert.ok(t.sess, t.kid.name + ' got no session'));
  for (let r = 0; r < ROUNDS; r++) {
    // A different order each round, as if the kids tapped at random.
    const order = tabs.slice().sort((a, b) => ((a.kid.i * 7 + r * 13) % USERS) - ((b.kid.i * 7 + r * 13) % USERS));
    order.forEach((t) => {
      const row = store.addItem(t.kid.classCode, t.kid.name, t.sess.id, itemFor(t.kid, r), ls);
      assert.ok(row, t.kid.name + ' round ' + r + ' was dropped');
    });
  }
  tabs.forEach((t) => assert.ok(store.endSession(t.kid.classCode, t.kid.name, t.sess.id, ls)));

  kids.forEach((kid) => assertOwnRowsOnly(kid, store.getStudent(kid.classCode, kid.name, ls)));
  assert.equal(store.listStudents('שילוב-א', ls).length, USERS / 2);
  assert.equal(store.listStudents('שילוב-ב', ls).length, USERS / 2);
  const board = store.buildClassOverview('שילוב-א', ls);
  board.forEach((row) => {
    assert.equal(row.total, ROUNDS);
    assert.equal(row.sessions, 1);
  });
});

test('a student logged in the wrong session id is refused, not written to another child', () => {
  const ls = memory();
  const a = store.startSession('שילוב-א', 'דנה', 'class', ls);
  const b = store.startSession('שילוב-א', 'רון', 'class', ls);
  assert.notEqual(a.id, b.id);
  assert.equal(store.addItem('שילוב-א', 'רון', a.id, itemFor({ classCode: 'שילוב-א', name: 'רון' }, 1), ls), null);
  assert.equal(store.allItems(store.getStudent('שילוב-א', 'דנה', ls)).length, 0);
  assert.equal(store.allItems(store.getStudent('שילוב-א', 'רון', ls)).length, 0);
});

test('20 students on 20 tablets: the teacher imports every export with nothing lost or mixed', () => {
  const kids = students();
  const exports = kids.map((kid) => {
    const ls = memory();
    const sess = store.startSession(kid.classCode, kid.name, 'practice', ls);
    for (let r = 0; r < ROUNDS; r++) store.addItem(kid.classCode, kid.name, sess.id, itemFor(kid, r), ls);
    store.endSession(kid.classCode, kid.name, sess.id, ls);
    return { kid: kid, json: store.exportRoster(kid.classCode, ls) };
  });

  const teacher = memory();
  exports.forEach((e) => {
    const res = store.importRoster(e.kid.classCode, e.json, teacher);
    assert.equal(res.ok, true);
    assert.equal(res.added, 1, e.kid.name + ' was not added as a new student');
  });
  // Importing every file a second time adds nothing.
  exports.forEach((e) => {
    const res = store.importRoster(e.kid.classCode, e.json, teacher);
    assert.equal(res.added + res.merged + res.notes + res.assignments, 0);
  });
  kids.forEach((kid) => assertOwnRowsOnly(kid, store.getStudent(kid.classCode, kid.name, teacher)));
  assert.deepEqual(teacher.keys().sort(), [store.storageKey('שילוב-א'), store.storageKey('שילוב-ב')].sort());
});

test('the remembered student is one per tablet, so switching kids never rewrites earlier answers', () => {
  const ls = memory();
  const kids = students().slice(0, 5);
  kids.forEach((kid) => {
    store.saveWho({ classCode: kid.classCode, name: kid.name }, ls);
    const who = store.loadWho(ls);
    const sess = store.startSession(who.classCode, who.name, 'class', ls);
    for (let r = 0; r < ROUNDS; r++) store.addItem(who.classCode, who.name, sess.id, itemFor(kid, r), ls);
  });
  assert.deepEqual(store.loadWho(ls), { classCode: kids[4].classCode, name: kids[4].name });
  kids.forEach((kid) => assertOwnRowsOnly(kid, store.getStudent(kid.classCode, kid.name, ls)));
});
