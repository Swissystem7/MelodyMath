// The class-mode "done" card reports the session that just ended.
// endClassSession() used to reload the student from storage and take the
// last class session in array order. That is the wrong session twice over:
// importRoster appends another tablet's rows after the local ones, so an
// older imported class session became "this session", and when storage
// cannot persist (quota, private mode) the live session is not in storage
// at all and the card showed yesterday's numbers as today's. The card must
// use the session endTeacherSession() just closed, and nothing else.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const store = require('../src/lib/teacherStore');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function fnSource(name) {
  const m = indexHtml.match(new RegExp('function ' + name + '\\(\\)\\{[^\\n]*'));
  assert.ok(m, name + ' is defined on one line in index.html');
  return m[0];
}

function memory(opts) {
  const m = Object.create(null);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => {
      if (opts && opts.readOnly) throw new Error('QuotaExceededError');
      m[k] = String(v);
    },
    removeItem: (k) => { delete m[k]; },
  };
}

function session(id, kind, started, correctFlags) {
  return {
    id, kind, started, ended: started + 100,
    items: correctFlags.map((c, i) => ({ skill: 'חיבור', prompt: i + '+1', answer: i + 1, given: c ? i + 1 : 0, correct: c, at: started + i })),
  };
}

function rosterWith(sessions) {
  return JSON.stringify({ v: 1, classCode: 'שילוב', students: { 'נועה': { name: 'נועה', created: 1, sessions, assignments: [] } } });
}

// Runs the page's endTeacherSession / endClassSession against the real
// teacherStore bound to the given storage, with the DOM reduced to the
// elements those two functions touch.
function page(ls) {
  const els = {};
  const el = (id) => (els[id] = els[id] || { innerHTML: '', textContent: '', classList: { add() {}, remove() {}, contains() { return false; } } });
  const ctx = {
    who: { classCode: 'שילוב', name: 'נועה' },
    openSess: null,
    classEndsAt: 0,
    classTimerId: null,
    clearInterval() {},
    document: { body: { classList: { add() {}, remove() {} } } },
    $: el,
    showClassCard(id) { ctx.shown = id; },
    startSession: (c, n, k) => store.startSession(c, n, k, ls),
    addItem: (c, n, id, item) => store.addItem(c, n, id, item, ls),
    endSession: (c, n, id) => store.endSession(c, n, id, ls),
    getStudent: (c, n) => store.getStudent(c, n, ls),
    Math,
  };
  vm.createContext(ctx);
  vm.runInContext(fnSource('endTeacherSession') + '\n' + fnSource('endClassSession'), ctx);
  ctx.els = els;
  ctx.stats = () => (els.classDoneStats.innerHTML.match(/<strong>([^<]*)<\/strong>/g) || []).map((s) => s.replace(/<\/?strong>/g, ''));
  return ctx;
}

test('the done card reports the live session, not an older class session imported mid-session', () => {
  const ls = memory();
  const p = page(ls);
  p.openSess = p.startSession('שילוב', 'נועה', 'class');
  p.addItem('שילוב', 'נועה', p.openSess.id, { skill: 'חיבור', prompt: '1+1', answer: 2, given: 2, correct: true });
  p.addItem('שילוב', 'נועה', p.openSess.id, { skill: 'חיבור', prompt: '2+1', answer: 3, given: 4, correct: false });
  p.addItem('שילוב', 'נועה', p.openSess.id, { skill: 'חיבור', prompt: '3+1', answer: 4, given: 4, correct: true });
  // The teacher pastes another tablet's roster while the class session is live.
  const res = store.importRoster('שילוב', rosterWith([session('other-old', 'class', 1000, [true, false, false, false, false])]), ls);
  assert.equal(res.ok, true);
  const stored = store.getStudent('שילוב', 'נועה', ls);
  assert.equal(stored.sessions[stored.sessions.length - 1].id, 'other-old', 'the imported session is last in array order');

  vm.runInContext('endClassSession()', p);

  assert.deepEqual(p.stats(), ['2/3', '67%']);
  assert.equal(p.shown, 'classDone');
  assert.equal(p.openSess, null);
  assert.equal(store.getStudent('שילוב', 'נועה', ls).sessions[0].ended !== null, true, 'the live session was closed in storage');
});

test('when storage cannot persist, the done card shows this session as empty rather than yesterday\'s numbers', () => {
  const ls = memory({ readOnly: true });
  const m = memory();
  m.setItem(store.storageKey('שילוב'), rosterWith([session('yesterday', 'class', 1000, [true, true, true, true])]));
  ls.getItem = m.getItem;
  const p = page(ls);
  p.openSess = p.startSession('שילוב', 'נועה', 'class');
  assert.ok(p.openSess, 'startSession still hands back an in-memory session');
  assert.equal(p.addItem('שילוב', 'נועה', p.openSess.id, { skill: 'חיבור', prompt: '1+1', answer: 2, given: 2, correct: true }), null);

  vm.runInContext('endClassSession()', p);

  assert.deepEqual(p.stats(), ['0/0', '0%']);
  assert.equal(p.openSess, null);
});

test('ending class mode with no open session reports 0/0 and leaves nothing open', () => {
  const ls = memory();
  ls.setItem(store.storageKey('שילוב'), rosterWith([session('yesterday', 'class', 1000, [true, true])]));
  const p = page(ls);
  vm.runInContext('endClassSession()', p);
  assert.deepEqual(p.stats(), ['0/0', '0%']);
  assert.equal(p.openSess, null);
});

test('endTeacherSession hands back the closed session and ignores a session of another kind on the done card', () => {
  const ls = memory();
  const p = page(ls);
  p.openSess = p.startSession('שילוב', 'נועה', 'beat');
  p.addItem('שילוב', 'נועה', p.openSess.id, { skill: 'חיבור', prompt: '1+1', answer: 2, given: 2, correct: true });
  const ended = vm.runInContext('endTeacherSession()', p);
  assert.equal(ended.kind, 'beat');
  assert.equal(ended.items.length, 1);
  assert.ok(ended.ended, 'the returned session carries its end time');
  assert.equal(vm.runInContext('endTeacherSession()', p), null);

  const q = page(ls);
  q.openSess = q.startSession('שילוב', 'נועה', 'beat');
  vm.runInContext('endClassSession()', q);
  assert.deepEqual(q.stats(), ['0/0', '0%']);
});

test('endClassSession no longer reloads the student to guess which session just ended', () => {
  const src = fnSource('endClassSession');
  assert.doesNotMatch(src, /getStudent\(/);
  assert.doesNotMatch(src, /slice\(-1\)/);
  assert.match(src, /const ended=endTeacherSession\(\)/);
});
