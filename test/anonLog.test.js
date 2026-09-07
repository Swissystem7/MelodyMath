const test = require('node:test');
const assert = require('node:assert/strict');
const anon = require('../src/lib/anonLog');

function memoryStore() {
  const bag = {};
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(bag, k) ? bag[k] : null),
    setItem: (k, v) => { bag[k] = String(v); },
    removeItem: (k) => { delete bag[k]; },
  };
}

test('normalizeEvent keeps only time, exercise, accuracy, duration', () => {
  const ev = anon.normalizeEvent({
    ts: 1_700_000_000_000,
    exerciseId: 'add-3',
    correct: true,
    durationMs: 1200,
    name: 'דני',
    email: 'a@b.c',
    phone: '050',
    classCode: 'ג3',
  });
  assert.deepEqual(ev, {
    ts: 1_700_000_000_000,
    exerciseId: 'add-3',
    correct: true,
    durationMs: 1200,
  });
  const dumped = JSON.stringify(ev);
  assert.equal(dumped.includes('דני'), false);
  assert.equal(dumped.includes('a@b.c'), false);
  assert.equal(dumped.includes('050'), false);
  assert.equal(dumped.includes('ג3'), false);
});

test('record + export never surface banned PII keys', () => {
  const store = memoryStore();
  anon.record({
    exerciseId: 'frac-1',
    correct: false,
    durationMs: 900,
    studentName: 'נועה',
    nationalId: '123',
  }, store);
  const rows = anon.exportEvents(store);
  assert.equal(rows.length, 1);
  const keys = Object.keys(rows[0]).sort();
  assert.deepEqual(keys, ['correct', 'durationMs', 'exerciseId', 'ts']);
  anon.BANNED_KEYS.forEach((k) => {
    assert.equal(Object.prototype.hasOwnProperty.call(rows[0], k), false);
  });
  const summary = anon.summarize(store);
  assert.equal(summary.anonymous, true);
  assert.equal(summary.pii, false);
  assert.equal(summary.total, 1);
  assert.equal(summary.correct, 0);
});

test('stripPii drops name-like keys but keeps exerciseId', () => {
  const cleaned = anon.stripPii({ exerciseId: 'x', name: 'y', fullName: 'z', durationMs: 1 });
  assert.equal(cleaned.exerciseId, 'x');
  assert.equal(cleaned.durationMs, 1);
  assert.equal(cleaned.name, undefined);
  assert.equal(cleaned.fullName, undefined);
});

test('logAttempt strips prompt/given/answer/name and never writes them', () => {
  const store = memoryStore();
  const ev = anon.logAttempt({
    id: 'ex-9',
    correct: true,
    durationMs: 400,
    prompt: 'כמה זה 2+2?',
    given: '5',
    answer: '4',
    name: 'דני',
    classCode: 'ג3',
    email: 'a@b.c',
    notes: 'secret',
  }, store);
  assert.equal(ev.exerciseId, 'ex-9');
  assert.equal(ev.correct, true);
  assert.equal(ev.durationMs, 400);
  const dumped = JSON.stringify(ev);
  assert.equal(dumped.includes('כמה'), false);
  assert.equal(dumped.includes('דני'), false);
  assert.equal(dumped.includes('a@b.c'), false);
  assert.equal(dumped.includes('secret'), false);
  assert.equal(dumped.includes('ג3'), false);
  const rows = anon.exportEvents(store);
  assert.equal(rows.length, 1);
  assert.deepEqual(Object.keys(rows[0]).sort(), ['correct', 'durationMs', 'exerciseId', 'ts']);
  assert.equal(JSON.stringify(rows[0]).includes('prompt'), false);
  assert.equal(JSON.stringify(rows[0]).includes('given'), false);
  assert.equal(JSON.stringify(rows[0]).includes('answer'), false);
  assert.equal(JSON.stringify(rows[0]).includes('name'), false);
});

test('logAttempt falls back exerciseId from skill/kind and clamps duration', () => {
  const store = memoryStore();
  const ev = anon.logAttempt({ skill: 'add', kind: 'practice', correct: 1, durationMs: -3 }, store);
  assert.equal(ev.exerciseId, 'add');
  assert.equal(ev.correct, true);
  assert.equal(ev.durationMs, 0);
  const ev2 = anon.logAttempt({ kind: 'beat', correct: false }, store);
  assert.equal(ev2.exerciseId, 'beat');
  assert.equal(ev2.correct, false);
});
