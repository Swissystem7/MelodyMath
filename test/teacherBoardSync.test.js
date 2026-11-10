// MM-7xx stream D: student device -> teacher device transfer (classSync.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/lib/teacherStore');
const sync = require('../src/lib/classBoard/classSync');

function mem() {
  const map = {};
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null),
    setItem: (k, v) => { map[k] = String(v); },
    removeItem: (k) => { delete map[k]; },
    dump: () => JSON.stringify(map),
  };
}

// A student device with one session of three answers.
function studentDevice(name, classCode) {
  const ls = mem();
  const s = store.startSession(classCode, name, 'diag', ls);
  store.addItem(classCode, name, s.id, { skill: 'חיבור עד 10', prompt: '3 + 4 = ?', answer: 7, given: '7', correct: true }, ls);
  store.addItem(classCode, name, s.id, { skill: 'חיסור עד 10', prompt: '9 − 5 = ?', answer: 4, given: '3', correct: false }, ls);
  store.addItem(classCode, name, s.id, { skill: 'חיסור עד 10', prompt: '8 − 2 = ?', answer: 6, given: '5', correct: false }, ls);
  return { ls, session: s };
}

test('a package carries only class code, name, grade, practice and tasks', () => {
  const { ls } = studentDevice('נועה', 'K7M-Q4P');
  store.setStudentGrade('K7M-Q4P', 'נועה', 'ב', ls);
  store.addNote('K7M-Q4P', 'נועה', 'הערה פרטית של המורה', ls);
  const out = sync.packageFromStorage('K7M-Q4P', 'נועה', ls, 5000);
  assert.equal(out.ok, true);
  assert.deepEqual(Object.keys(out.pkg).sort(), ['a', 'c', 'g', 'k', 'n', 's', 't', 'v', 'x']);
  assert.equal(out.pkg.c, 'K7M-Q4P');
  assert.equal(out.pkg.n, 'נועה');
  assert.equal(out.pkg.g, 'ב');
  assert.equal(out.pkg.x, 5000);
  const text = JSON.stringify(out.pkg);
  assert.doesNotMatch(text, /הערה פרטית/, 'teacher notes never leave the device');
  assert.doesNotMatch(text, /created/);
  const row = sync.expandPackage(out.pkg);
  assert.equal(row.sessions.length, 1);
  assert.equal(row.sessions[0].items.length, 3);
  assert.equal(row.sessions[0].items[1].skill, 'חיסור עד 10');
});

test('names that look like contact details, ID numbers or full names are refused', () => {
  assert.equal(sync.checkName('נועה').ok, true);
  assert.equal(sync.checkName('נועה ב').ok, true);
  assert.equal(sync.checkName('🎺 7').ok, true);
  assert.equal(sync.checkName('noa@example.com').reason, 'email');
  assert.equal(sync.checkName('נועה 123456789').reason, 'digits');
  assert.equal(sync.checkName('נועה בת כהן').reason, 'full-name');
  assert.equal(sync.checkName('').reason, 'empty');
  assert.match(sync.nameProblem('נועה בת כהן'), /שם פרטי או כינוי/);
  const bad = sync.buildPackage({ name: 'a@b.c', sessions: [] }, { classCode: 'x' });
  assert.equal(bad.ok, false);
});

test('plain code round-trips through decodeSync and decode', async () => {
  const { ls } = studentDevice('נועה', 'K7M-Q4P');
  const { pkg } = sync.packageFromStorage('K7M-Q4P', 'נועה', ls, 7000);
  const plain = sync.encodePlain(pkg);
  assert.match(plain, /^MM2\.[A-Za-z0-9_-]+$/);
  const d1 = sync.decodeSync('הנה הקוד שלי: ' + plain + ' תודה');
  assert.equal(d1.ok, true);
  assert.equal(d1.kind, 'progress');
  assert.equal(d1.rows[0].name, 'נועה');
  const d2 = await sync.decode('https://example.org/class.html#mm=' + plain);
  assert.equal(d2.ok, true);
});

test('compressed code is shorter and round-trips', async () => {
  const { ls } = studentDevice('נועה', 'K7M-Q4P');
  const { pkg } = sync.packageFromStorage('K7M-Q4P', 'נועה', ls, 7000);
  const z = await sync.encode(pkg);
  assert.ok(z.length <= sync.encodePlain(pkg).length);
  const d = await sync.decode(z);
  assert.equal(d.ok, true);
  assert.equal(d.rows[0].sessions[0].items.length, 3);
  if (z.startsWith('MM2z.')) assert.equal(sync.decodeSync(z).error, 'zipped');
});

test('importing on the teacher device adds the student and the gap data', () => {
  const { ls } = studentDevice('נועה', 'K7M-Q4P');
  const { pkg } = sync.packageFromStorage('K7M-Q4P', 'נועה', ls, 7000);
  const teacher = mem();
  const res = sync.applyDecoded(sync.decodeSync(sync.encodePlain(pkg)), teacher, { now: 9000 });
  assert.equal(res.ok, true);
  assert.equal(res.added, 1);
  assert.equal(res.items, 3);
  const row = store.getStudent('K7M-Q4P', 'נועה', teacher);
  assert.equal(row.sessions[0].items.length, 3);
  assert.deepEqual(row.sync, { exportedAt: 7000, importedAt: 9000, via: 'code' });
  assert.match(sync.summarize(res), /נקלט: נועה/);
  assert.match(sync.summarize(res), /3 תשובות חדשות/);
});

test('importing the same code twice changes nothing (idempotent)', () => {
  const { ls } = studentDevice('נועה', 'K7M-Q4P');
  const code = sync.encodePlain(sync.packageFromStorage('K7M-Q4P', 'נועה', ls, 7000).pkg);
  const teacher = mem();
  sync.applyDecoded(sync.decodeSync(code), teacher, { now: 9000 });
  const before = teacher.dump();
  const again = sync.applyDecoded(sync.decodeSync(code), teacher, { now: 9999 });
  assert.equal(again.ok, true);
  assert.equal(again.unchanged, true);
  assert.equal(teacher.dump(), before);
  assert.match(sync.summarize(again), /כבר נקלט/);
});

test('a later code adds only the new answers of a session already imported', () => {
  const { ls, session } = studentDevice('נועה', 'K7M-Q4P');
  const teacher = mem();
  sync.applyDecoded(sync.decodeSync(sync.encodePlain(sync.packageFromStorage('K7M-Q4P', 'נועה', ls, 7000).pkg)), teacher, { now: 7100 });
  store.addItem('K7M-Q4P', 'נועה', session.id, { skill: 'חיסור עד 10', prompt: '7 − 3 = ?', answer: 4, given: '4', correct: true }, ls);
  store.endSession('K7M-Q4P', 'נועה', session.id, ls);
  const res = sync.applyDecoded(sync.decodeSync(sync.encodePlain(sync.packageFromStorage('K7M-Q4P', 'נועה', ls, 8000).pkg)), teacher, { now: 8100 });
  assert.equal(res.items, 1);
  assert.equal(res.sessions, 0);
  const row = store.getStudent('K7M-Q4P', 'נועה', teacher);
  assert.equal(row.sessions.length, 1);
  assert.equal(row.sessions[0].items.length, 4);
  assert.ok(row.sessions[0].ended);
  assert.equal(row.sync.exportedAt, 8000);
});

test('newest wins per item; an older code never overwrites a newer one', () => {
  const at = 1000;
  const base = { name: 'דן', sessions: [{ id: 's1', kind: 'diag', started: at, items: [{ skill: 'כפל', prompt: '3 × 4', answer: '12', given: '11', correct: false, at: at + 5 }] }] };
  const fixed = JSON.parse(JSON.stringify(base));
  fixed.sessions[0].items[0].given = '12';
  fixed.sessions[0].items[0].correct = true;
  const teacher = mem();
  const older = sync.buildPackage(base, { classCode: 'c', now: 2000 }).pkg;
  const newer = sync.buildPackage(fixed, { classCode: 'c', now: 3000 }).pkg;
  sync.applyDecoded(sync.classify(newer), teacher, { now: 3100 });
  const stale = sync.applyDecoded(sync.classify(older), teacher, { now: 3200 });
  assert.equal(stale.stale, true);
  assert.equal(stale.updated, 0);
  assert.equal(store.getStudent('c', 'דן', teacher).sessions[0].items[0].correct, true);
  assert.match(sync.summarize(stale), /ישן יותר/);
  // And the other order: the newer copy replaces the older one.
  const t2 = mem();
  sync.applyDecoded(sync.classify(older), t2, { now: 1 });
  const upd = sync.applyDecoded(sync.classify(newer), t2, { now: 2 });
  assert.equal(upd.updated, 1);
  assert.equal(store.getStudent('c', 'דן', t2).sessions[0].items[0].correct, true);
});

test('two devices of the same student merge into one row', () => {
  const tablet = studentDevice('נועה', 'K7M-Q4P').ls;
  const phone = studentDevice('נועה', 'K7M-Q4P').ls;
  const teacher = mem();
  sync.applyDecoded(sync.classify(sync.packageFromStorage('K7M-Q4P', 'נועה', tablet, 10).pkg), teacher, {});
  sync.applyDecoded(sync.classify(sync.packageFromStorage('K7M-Q4P', 'נועה', phone, 20).pkg), teacher, {});
  const row = store.getStudent('K7M-Q4P', 'נועה', teacher);
  assert.equal(row.sessions.length, 2);
});

test('task status: done on the student device marks it done for the teacher, never undone', () => {
  const teacher = mem();
  store.upsertStudent('c', 'רון', teacher);
  const task = store.assignTask('c', 'רון', { title: 'תרגול חיסור', skill: 'חיסור עד 10' }, teacher);
  const tp = sync.buildTasksPackage('c', 'רון', store.listAssignments('c', 'רון', teacher), 50);
  assert.equal(tp.ok, true);
  // Student device receives the task.
  const kid = mem();
  const got = sync.applyDecoded(sync.decodeSync(sync.encodePlain(tp.pkg)), kid, {});
  assert.equal(got.kind, 'tasks');
  assert.equal(got.tasks, 1);
  assert.match(sync.summarize(got), /משימה חדשה אחת/);
  assert.equal(sync.applyDecoded(sync.decodeSync(sync.encodePlain(tp.pkg)), kid, {}).unchanged, true);
  // Student completes it, sends progress back.
  const roster = store.loadRoster('c', kid);
  roster.students['רון'].assignments[0].completed = true;
  roster.students['רון'].assignments[0].completedAt = 70;
  store.saveRoster('c', roster, kid);
  const back = sync.applyDecoded(sync.classify(sync.packageFromStorage('c', 'רון', kid, 80).pkg), teacher, {});
  assert.equal(back.tasksDone, 1);
  const row = store.getStudent('c', 'רון', teacher);
  assert.equal(row.assignments.length, 1);
  assert.equal(row.assignments[0].id, task.id);
  assert.equal(row.assignments[0].completed, true);
  // An old code where the task is still open does not reopen it.
  sync.applyDecoded(sync.classify(sync.buildPackage({ name: 'רון', assignments: [Object.assign({}, task)] }, { classCode: 'c', now: 90 }).pkg), teacher, {});
  assert.equal(store.getStudent('c', 'רון', teacher).assignments[0].completed, true);
});

test('a grade the teacher set wins; an empty grade is filled in', () => {
  const teacher = mem();
  store.upsertStudent('c', 'גל', teacher);
  sync.applyDecoded(sync.classify(sync.buildPackage({ name: 'גל', grade: 'ג' }, { classCode: 'c', now: 1 }).pkg), teacher, {});
  assert.equal(store.getStudent('c', 'גל', teacher).grade, 'ג');
  store.setStudentGrade('c', 'גל', 'ד', teacher);
  sync.applyDecoded(sync.classify(sync.buildPackage({ name: 'גל', grade: 'ב' }, { classCode: 'c', now: 2 }).pkg), teacher, {});
  assert.equal(store.getStudent('c', 'גל', teacher).grade, 'ד');
});

test('legacy roster files and old #import= payloads still import', () => {
  const src = studentDevice('נועה', 'שילוב').ls;
  const teacher = mem();
  const res = sync.applyDecoded(sync.decodeSync(store.exportRoster('שילוב', src)), teacher, {});
  assert.equal(res.ok, true);
  assert.equal(res.kind, 'legacy');
  assert.equal(store.getStudent('שילוב', 'נועה', teacher).sessions[0].items.length, 3);
  const qrSync = require('../src/lib/qrSync');
  const old = qrSync.packStudent('נועה', 'שילוב', src);
  const t2 = mem();
  const r2 = sync.applyDecoded(sync.decodeSync(old.url), t2, {});
  assert.equal(r2.ok, true);
  assert.equal(store.getStudent('שילוב', 'נועה', t2).sessions.length, 1);
});

test('broken input gives a clear Hebrew message, never a throw', async () => {
  for (const bad of ['', 'שלום', 'MM2.@@@', 'MM2.e30', '{"x":1}', '#import=%%%', null]) {
    const d = await sync.decode(bad);
    assert.equal(d.ok, false, String(bad));
    assert.ok(sync.summarize(sync.applyDecoded(d, mem(), {})).length > 5);
  }
  const proto = sync.classify({ t: 'mm-progress', n: '__proto__', s: [] });
  assert.equal(proto.ok, false);
  // Hostile rows are dropped, not stored.
  const pkg = { t: 'mm-progress', v: 2, c: 'c', n: 'דנה', x: 1, k: ['a'], s: [null, 'x', [null], ['s1', 'diag', 5, 0, [null, [0, 'q', '1', '1', 1, 2]]]], a: [null, ['t', ''], ['t2', 'כותרת']] };
  const row = sync.expandPackage(pkg);
  assert.equal(row.sessions.length, 1);
  assert.equal(row.sessions[0].items.length, 1);
  assert.equal(row.assignments.length, 1);
});
