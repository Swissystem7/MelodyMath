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

test('class codes are trimmed and two classes do not share a roster', () => {
  const ls = memory();
  store.upsertStudent('  שילוב א  ', 'נועה', ls);
  store.upsertStudent('שילוב ב', 'נועה', ls);
  assert.deepEqual(store.listStudents('שילוב א', ls), ['נועה']);
  assert.equal(store.listStudents('שילוב א', ls).length, 1);
  const a = store.getStudent('שילוב א', 'נועה', ls);
  const b = store.getStudent('שילוב ב', 'נועה', ls);
  assert.ok(a && b);
  assert.notEqual(store.storageKey('שילוב א'), store.storageKey('שילוב ב'));
});

test('a session records items and the report splits accuracy by skill', () => {
  const ls = memory();
  const sess = store.startSession('כיתה', 'יוסי', 'diag', ls);
  store.addItem('כיתה', 'יוסי', sess.id, { skill: 'חיבור', prompt: '2+2', answer: 4, given: 4, correct: true }, ls);
  store.addItem('כיתה', 'יוסי', sess.id, { skill: 'חיבור', prompt: '3+1', answer: 4, given: 5, correct: false }, ls);
  store.addItem('כיתה', 'יוסי', sess.id, { skill: 'מנייה', prompt: 'ספרו', answer: 5, given: 5, correct: true }, ls);
  store.endSession('כיתה', 'יוסי', sess.id, ls);
  const report = store.buildReport(store.getStudent('כיתה', 'יוסי', ls));
  assert.equal(report.total, 3);
  assert.equal(report.correct, 2);
  const add = report.perSkill.find((s) => s.skill === 'חיבור');
  assert.equal(add.correct, 1);
  assert.equal(add.total, 2);
  assert.equal(add.accuracy, 0.5);
  assert.equal(report.sessions.length, 1);
  assert.equal(report.sessions[0].kind, 'diag');
});

test('repeating errors are prompts missed at least twice; streak counts a tail of correct answers', () => {
  const ls = memory();
  const sess = store.startSession('כ', 'תמר', 'class', ls);
  store.addItem('כ', 'תמר', sess.id, { skill: 'חיסור', prompt: '7-3', correct: false }, ls);
  store.addItem('כ', 'תמר', sess.id, { skill: 'חיסור', prompt: '7-3', correct: false }, ls);
  store.addItem('כ', 'תמר', sess.id, { skill: 'חיבור', prompt: '1+1', correct: true }, ls);
  store.addItem('כ', 'תמר', sess.id, { skill: 'חיבור', prompt: '2+2', correct: true }, ls);
  const report = store.buildReport(store.getStudent('כ', 'תמר', ls));
  assert.equal(report.repeatingErrors.length, 1);
  assert.equal(report.repeatingErrors[0].prompt, '7-3');
  assert.equal(report.repeatingErrors[0].count, 2);
  assert.equal(report.streak.current, 2);
  assert.equal(report.streak.best, 2);
});

test('makeChoices always includes the key and four distinct non-negative options', () => {
  let i = 0;
  const rng = () => { i += 1; return (i % 10) / 10; };
  const opts = store.makeChoices(5, rng);
  assert.equal(opts.length, 4);
  assert.ok(opts.includes(5));
  assert.equal(new Set(opts).size, 4);
  opts.forEach((n) => assert.ok(n >= 0));
});

test('export then import merges sessions and rejects garbage', () => {
  const src = memory();
  const dest = memory();
  const a = store.startSession('שילוב', 'דני', 'class', src);
  store.addItem('שילוב', 'דני', a.id, { skill: 'מנייה', prompt: '3', correct: true }, src);
  const json = store.exportRoster('שילוב', src);
  const first = store.importRoster('שילוב', json, dest);
  assert.equal(first.ok, true);
  assert.equal(first.added, 1);
  const again = store.importRoster('שילוב', json, dest);
  assert.equal(again.ok, true);
  assert.equal(store.getStudent('שילוב', 'דני', dest).sessions.length, 1);
  assert.equal(store.importRoster('שילוב', '{nope', dest).ok, false);
  assert.equal(store.importRoster('שילוב', '{"students":null}', dest).ok, false);
});

test('loadJson/saveJson namespace keys and survive garbage', () => {
  const ls = memory();
  assert.equal(store.saveJson('sf-807', { score: 3 }, ls), true);
  assert.equal(store.loadJson('sf-807', null, ls).score, 3);
  ls.setItem('mm:v1:bad', '{');
  assert.equal(store.loadJson('bad', 7, ls), 7);
});

test('an empty name is refused and a missing student yields a blank report', () => {
  const ls = memory();
  assert.equal(store.upsertStudent('כ', '   ', ls), null);
  const report = store.buildReport(null);
  assert.equal(report.total, 0);
  assert.deepEqual(report.repeatingErrors, []);
});
