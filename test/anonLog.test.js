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
