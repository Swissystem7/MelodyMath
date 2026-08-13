const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/lib/core');

test('answer normalizer treats a Hebrew comma as the decimal separator', () => {
  assert.equal(core.normalizeAnswer('1,25'), '1.25');
  assert.ok(core.isCorrect('1,25', 1.25));
  assert.ok(core.isCorrect('3,50', '3.5'));
  assert.equal(core.parseStudentNumber('1,25'), 1.25);
  assert.equal(core.parseStudentNumber('1.234,5'), 1234.5);
});

test('answer normalizer accepts a leading dot and trailing zeros', () => {
  assert.ok(core.isCorrect('.75', 0.75));
  assert.ok(core.isCorrect('3.50', 3.5));
  assert.ok(core.isCorrect(' 3 : 2 ', '3:2'));
  assert.ok(!core.isCorrect('', 0));
});

test('rhythm mapping prints 1/4+1/2+1/8 instead of raw 0.25 keys', () => {
  assert.equal(core.fractionName(0.25), '1/4');
  assert.equal(core.fractionName(0.5), '1/2');
  assert.equal(core.fractionName(0.125), '1/8');
  assert.equal(core.formatRhythmPattern([0.25, 0.5, 0.125]), '1/4+1/2+1/8');
});

test('spaced-repetition scheduling prefers a miss on the next turn', () => {
  const bank = [
    { id: 1, level: 1 },
    { id: 2, level: 1 },
    { id: 3, level: 1 },
  ];
  const afterMiss = core.eligibleExercises(bank, [{ id: 1, correct: false }], 2, 1);
  assert.deepEqual(afterMiss.map((x) => x.id), [1]);
  const afterHit = core.eligibleExercises(bank, [{ id: 1, correct: true }], 1, 1);
  assert.ok(!afterHit.some((x) => x.id === 1));
  assert.equal(core.nextLevel(1, [{ correct: true }, { correct: true }]), 2);
  assert.equal(core.nextLevel(2, [{ correct: false }, { correct: false }]), 1);
});

test('exam tolerance accepts 497.7 against 497.66 at one decimal', () => {
  assert.ok(core.closeEnough(497.7, 497.66, 2, '497.7'));
  assert.ok(core.closeEnough(3.5, 3.50, 2, '3.5'));
  assert.ok(!core.closeEnough(4, 3, 2, '4'));
  assert.equal(core.parseStudentNumber('.75'), 0.75);
});

test('sweep narration names x, y, a root, and an undefined stretch', () => {
  const mid = core.sweepNarration(2, 0, { root: true });
  assert.match(mid, /איקס/);
  assert.match(mid, /שורש/);
  const off = core.sweepNarration(-1, NaN, { undefined: true });
  assert.match(off, /לא מוגדר|מחוץ לתחום/);
});
