const test = require('node:test');
const assert = require('node:assert/strict');
const { nextLevel, isCorrect, normalizeAnswer, eligibleExercises, MIN_LEVEL, MAX_LEVEL } = require('../src/lib/adaptive');

const right = { correct: true };
const wrong = { correct: false };

test('two right in a row moves up a level', () => {
  assert.equal(nextLevel(1, [right, right]), 2);
});

test('two wrong in a row moves down a level', () => {
  assert.equal(nextLevel(2, [wrong, wrong]), 1);
});

test('a mixed pair holds the level', () => {
  assert.equal(nextLevel(2, [right, wrong]), 2);
  assert.equal(nextLevel(2, [wrong, right]), 2);
});

test('fewer than two answers never changes the level', () => {
  assert.equal(nextLevel(2, []), 2);
  assert.equal(nextLevel(2, [right]), 2);
});

test('a struggling child is never pushed below the easiest level', () => {
  assert.equal(nextLevel(MIN_LEVEL, [wrong, wrong]), MIN_LEVEL);
});

test('a strong child is never pushed past the hardest level', () => {
  assert.equal(nextLevel(MAX_LEVEL, [right, right]), MAX_LEVEL);
});

test('a full session of failure lands on the easiest level, not below it', () => {
  let level = MAX_LEVEL;
  for (let i = 0; i < 10; i++) level = nextLevel(level, [wrong, wrong]);
  assert.equal(level, MIN_LEVEL);
});

test('spacing and a decimal comma do not fail a correct answer', () => {
  assert.ok(isCorrect(' 3:2 ', '3:2'));
  assert.ok(isCorrect('3 : 2', '3:2'));
  assert.ok(isCorrect('0,75', 0.75));
  assert.ok(isCorrect('3.5', 3.5));
});

test('numeric answers match across trailing zeros, a leading-dot, and a comma', () => {
  assert.ok(isCorrect('3.50', 3.5));
  assert.ok(isCorrect('3.5', '3.50'));
  assert.ok(isCorrect('.75', 0.75));
  assert.ok(isCorrect('1,25', 1.25));
  assert.ok(isCorrect('3,50', 3.5));
  assert.ok(!isCorrect('3.51', 3.5));
});

test('a negative answer is compared as written', () => {
  assert.ok(isCorrect('-12', -12));
  assert.ok(!isCorrect('12', -12));
});

test('an empty answer is never counted as correct', () => {
  for (const empty of ['', '   ', '\t']) assert.ok(!isCorrect(empty, ''));
});

test('a wrong answer stays wrong', () => {
  assert.ok(!isCorrect('4', 3));
  assert.ok(!isCorrect('2:3', '3:2'));
});

test('normalisation is idempotent', () => {
  const once = normalizeAnswer(' 3 , 5 ');
  assert.equal(normalizeAnswer(once), once);
});

const bank = [{ id: 1, level: 1 }, { id: 2, level: 1 }, { id: 3, level: 1 }, { id: 4, level: 2 }];

test('a wrong answer stays eligible so it can return sooner', () => {
  // lastId is a different item — the miss must be preferred, not treated as "seen"
  const pool = eligibleExercises(bank, [{ id: 1, correct: false }], 2, 1);
  assert.deepEqual(pool.map((x) => x.id), [1]);
});

test('a correct answer is not asked again while others remain', () => {
  const pool = eligibleExercises(bank, [{ id: 1, correct: true }], 1, 1);
  assert.deepEqual(pool.map((x) => x.id).sort(), [2, 3]);
});

test('a recently missed item is preferred on the following turn', () => {
  const history = [{ id: 1, correct: false }, { id: 2, correct: true }];
  const pool = eligibleExercises(bank, history, 2, 1);
  assert.deepEqual(pool.map((x) => x.id), [1]);
});
