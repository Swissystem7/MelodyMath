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

test('807-style 1-decimal answers pass against a 2-decimal key', () => {
  const { parseStudentNumber, closeEnough } = require('../src/lib/adaptive');
  assert.equal(parseStudentNumber('1,25'), 1.25);
  assert.equal(parseStudentNumber('.75'), 0.75);
  assert.ok(closeEnough(497.7, 497.66, 2, '497.7'));
  assert.ok(closeEnough(3.5, 3.5, 2, '3.50'));
  assert.ok(!closeEnough(4, 3, 2, '4'));
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

// ---------------------------------------------------------------------------
// M1 — pacing the level from P(known) instead of a two-answer streak.
//
// `pace: 'bkt'` is opt-in. See the header of src/lib/adaptive.js: the backlog
// asked for BKT to replace the streak rule AND for the existing tests to keep
// passing, and those two cannot both hold — two correct answers give
// P(known) = 0.843952, inside the 0.4..0.85 HOLD band, while
// test/banks.test.js:153 pins level 2 after exactly those two answers.
// ---------------------------------------------------------------------------

const adaptive = require('../src/lib/adaptive');
const bkt = require('../src/lib/mastery');

const recs = (flags) => flags.map((c, i) => ({ id: i + 1, correct: c }));
const BKT = { pace: 'bkt' };

test('paceLevel defaults to the streak rule, so nothing existing changes', () => {
  assert.equal(adaptive.paceLevel(1, [right, right]), 2);
  assert.equal(adaptive.paceLevel(2, [wrong, wrong]), 1);
  assert.equal(adaptive.paceLevel(2, [right, wrong]), 2);
  assert.equal(adaptive.paceLevel(2, []), 2);
  // an unspecified pace, and an unknown one, both stay on the streak rule
  assert.equal(adaptive.paceLevel(1, [right, right], {}), 2);
  assert.equal(adaptive.paceLevel(1, [right, right], { pace: 'whatever' }), 2);
});

test('BKT pacing holds at two correct answers and only moves up on the third', () => {
  // P = 0.843952 -> inside 0.4..0.85 -> hold. This is the one place BKT and
  // the streak rule visibly disagree, and it is why the default is unchanged.
  assert.equal(bkt.masteryFromHistory(recs([true, true])).toFixed(6), '0.843952');
  assert.equal(adaptive.paceLevel(1, recs([true, true]), BKT), 1);

  // P = 0.958476 -> above 0.85 -> harder
  assert.equal(bkt.masteryFromHistory(recs([true, true, true])).toFixed(6), '0.958476');
  assert.equal(adaptive.paceLevel(1, recs([true, true, true]), BKT), 2);
});

test('BKT pacing drops the level while P(known) is under 0.4', () => {
  assert.equal(bkt.masteryFromHistory(recs([false, false])).toFixed(6), '0.173761');
  assert.equal(adaptive.paceLevel(2, recs([false, false]), BKT), 1);
  assert.equal(adaptive.paceLevel(3, recs([false]), BKT), 2);
  // and it never leaves 1..3
  assert.equal(adaptive.paceLevel(MIN_LEVEL, recs([false, false, false]), BKT), MIN_LEVEL);
  assert.equal(adaptive.paceLevel(MAX_LEVEL, recs([true, true, true, true]), BKT), MAX_LEVEL);
});

test('BKT pacing reads the whole history, so one slip does not undo five successes', () => {
  const fiveThenSlip = recs([true, true, true, true, true, false]);
  // the streak rule only ever sees the last two answers -> mixed pair -> hold
  assert.equal(adaptive.paceLevel(2, fiveThenSlip), 2);
  // BKT still has five correct answers on the books: P = 0.984910 -> harder
  assert.equal(bkt.masteryFromHistory(fiveThenSlip).toFixed(6), '0.984910');
  assert.equal(adaptive.paceLevel(2, fiveThenSlip, BKT), 3);

  // and the mirror case: four misses then one lucky-looking hit is not mastery
  const fourThenHit = recs([false, false, false, false, true]);
  assert.equal(bkt.masteryFromHistory(fourThenHit).toFixed(6), '0.515277');
  assert.equal(adaptive.paceLevel(2, fourThenHit, BKT), 2);
});

test('BKT pacing accepts per-child parameters', () => {
  // a faster learner (pLearn 0.3) clears 0.85 on the second correct answer
  const fast = { pace: 'bkt', params: { pLearn: 0.3 } };
  assert.equal(bkt.masteryFromHistory(recs([true, true]), fast.params).toFixed(6), '0.902390');
  assert.equal(adaptive.paceLevel(1, recs([true, true]), fast), 2);
  assert.equal(adaptive.paceLevel(1, recs([true, true]), BKT), 1);
});

test('masteryOf exposes P(known) and a non-numeric level is handed straight back', () => {
  assert.equal(adaptive.masteryOf(recs([true, true, true])).toFixed(6), '0.958476');
  assert.equal(adaptive.masteryOf([]), bkt.BKT_DEFAULTS.pInit);
  // same shrug the streak rule gave for a level it cannot reason about
  assert.equal(adaptive.nextLevelFromMastery(undefined, []), undefined);
  assert.equal(adaptive.nextLevelFromMastery('x', recs([true, true, true])), 'x');
});

const pacedBank = [{ id: 1, level: 1 }, { id: 2, level: 1 }, { id: 3, level: 1 }, { id: 4, level: 2 }];

test('eligibleExercises paces from P(known) when asked, and from the streak otherwise', () => {
  const twoRight = [{ id: 1, correct: true }, { id: 2, correct: true }];
  // streak (default): two right -> level 2 -> the only level-2 item
  assert.deepEqual(eligibleExercises(pacedBank, twoRight, 2, 1).map((x) => x.id), [4]);
  // BKT: P = 0.843952 -> hold at level 1 -> the remaining unmastered level-1 item
  assert.deepEqual(eligibleExercises(pacedBank, twoRight, 2, 1, BKT).map((x) => x.id), [3]);

  const threeRight = twoRight.concat([{ id: 3, correct: true }]);
  // by the third correct answer both rules agree on level 2
  assert.deepEqual(eligibleExercises(pacedBank, threeRight, 3, 1).map((x) => x.id), [4]);
  assert.deepEqual(eligibleExercises(pacedBank, threeRight, 3, 1, BKT).map((x) => x.id), [4]);
});

test('BKT pacing still returns a miss to the child before anything new', () => {
  const history = [{ id: 1, correct: false }, { id: 2, correct: true }];
  assert.deepEqual(eligibleExercises(pacedBank, history, 2, 1, BKT).map((x) => x.id), [1]);
});
