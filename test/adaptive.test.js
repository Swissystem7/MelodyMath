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

// ---------------------------------------------------------------------------
// R2-D — exact gating transitions, step by step, for both pacing rules.
//
// The tests above pin endpoints. These pin the whole walk: after every single
// answer, what P(known) is, which band it falls in, and what each rule does
// with the level it is carrying. Every number below was worked out first in a
// scratch script from the BKT recurrence (evidence then learning, pInit 0.2,
// pLearn 0.15, pSlip 0.1, pGuess 0.25) and from the two-answer streak rule,
// not read out of src/lib/adaptive.js.
//
// The default is untouched: `pace: 'bkt'` is opt-in, because two correct
// answers give P = 0.843952, inside the 0.4..0.85 HOLD band, while
// test/banks.test.js:153 pins level 2 after exactly those two answers.
// ---------------------------------------------------------------------------

// One step of a walk: the flag answered, P(known) over the whole history to
// here, and the level each rule is carrying afterwards.
function walk(flags, start) {
  const history = [];
  let streak = start;
  let paced = start;
  return flags.map((correct, i) => {
    history.push({ id: i + 1, correct: correct });
    streak = adaptive.paceLevel(streak, history);
    paced = adaptive.paceLevel(paced, history, BKT);
    return {
      p: bkt.masteryFromHistory(history).toFixed(6),
      streak: streak,
      bkt: paced,
    };
  });
}

test('four right then four wrong, one answer at a time, under both rules', () => {
  assert.deepEqual(walk([true, true, true, true, false, false, false, false], 1), [
    // P(known)   streak  bkt      band       what happened
    { p: '0.552632', streak: 1, bkt: 1 }, // same    one answer is not a streak
    { p: '0.843952', streak: 2, bkt: 1 }, // same    the streak moves, BKT holds
    { p: '0.958476', streak: 3, bkt: 2 }, // harder  BKT is one answer behind
    { p: '0.989893', streak: 3, bkt: 3 }, // harder  both at the ceiling
    { p: '0.939537', streak: 3, bkt: 3 }, // harder  one slip changes nothing
    { p: '0.723296', streak: 2, bkt: 3 }, // same    the streak drops first
    { p: '0.369684', streak: 1, bkt: 2 }, // easier  BKT starts down
    { p: '0.211650', streak: 1, bkt: 1 }, // easier  both on the floor
  ]);
  // read as a whole: BKT lags the streak rule in BOTH directions, because it
  // is fitting the whole history rather than the last two answers. It is the
  // slower rule, not the more eager one.
});

test('alternating right and wrong: the streak rule never moves, BKT sits on the floor', () => {
  assert.deepEqual(walk([true, false, true, false, true, false], 2), [
    { p: '0.552632', streak: 2, bkt: 2 }, // same
    { p: '0.270202', streak: 2, bkt: 1 }, // easier
    { p: '0.635642', streak: 2, bkt: 1 }, // same, so it stays where it is
    { p: '0.310405', streak: 2, bkt: 1 }, // easier, already at the floor
    { p: '0.675629', streak: 2, bkt: 1 }, // same
    { p: '0.334752', streak: 2, bkt: 1 }, // easier
  ]);
  // every pair the streak rule ever sees is mixed, so it holds for ever: a
  // child answering half the questions right is left at the level they
  // started on. That is the case the BKT option exists for.
});

test('the streak rule alone: exact levels over a nine-answer session', () => {
  const flags = [true, true, true, false, true, false, false, false, false];
  assert.deepEqual(walk(flags, 1).map((s) => s.streak), [1, 2, 3, 3, 3, 3, 2, 1, 1]);
  // one miss among hits never moves it, and it stops at the floor
});

test('with no answers at all the two rules disagree, and BKT drops the level', () => {
  // P(no history) is pInit = 0.2, which is below 0.4, so the BKT rule reads
  // "not yet known" and eases — before the child has answered anything.
  assert.equal(bkt.masteryFromHistory([]), bkt.BKT_DEFAULTS.pInit);
  assert.equal(bkt.masteryBand(bkt.BKT_DEFAULTS.pInit), 'easier');
  assert.equal(adaptive.paceLevel(3, [], BKT), 2);
  assert.equal(adaptive.paceLevel(2, [], BKT), 1);
  assert.equal(adaptive.paceLevel(1, [], BKT), MIN_LEVEL);
  // the streak rule holds instead, because two answers is what it needs
  assert.equal(adaptive.paceLevel(3, []), 3);
  assert.equal(adaptive.paceLevel(2, []), 2);
  assert.equal(adaptive.paceLevel(2, [right]), 2);
  // and a first answer does not rescue it either way
  assert.equal(adaptive.paceLevel(2, recs([true]), BKT), 2); // P = 0.5526 -> same
  assert.equal(adaptive.paceLevel(2, recs([false]), BKT), 1); // P = 0.1774 -> easier
});

test('BKT off in every sense means the streak rule, unchanged', () => {
  const twoRight = recs([true, true]);
  // 1. no options, an empty one, an unknown pace, an explicit one, and
  //    options that are not an object at all
  [undefined, {}, { pace: 'whatever' }, { pace: 'streak' }, { pace: null },
    'bkt', 42, true, null].forEach((opt) => {
    assert.equal(adaptive.paceLevel(1, twoRight, opt), 2, JSON.stringify(opt));
    assert.equal(adaptive.paceLevel(2, recs([false, false]), opt), 1, JSON.stringify(opt));
  });
  // BKT asked for, and it holds — this is the difference the flag makes
  assert.equal(adaptive.paceLevel(1, twoRight, BKT), 1);
});

test('BKT asked for but mastery.js unreachable falls back to the streak rule', () => {
  // adaptive.js resolves mastery.js lazily through the same module object the
  // test holds, so removing the entry point is exactly the browser case where
  // index.html never loaded src/lib/mastery.js.
  const saved = bkt.masteryFromHistory;
  delete bkt.masteryFromHistory;
  try {
    assert.equal(adaptive.masteryOf(recs([true, true])), null);
    // the discriminating case: BKT would hold at 1 here, the streak rule
    // moves to 2, and with mastery gone it must be the streak answer
    assert.equal(adaptive.paceLevel(1, recs([true, true]), BKT), 2);
    assert.equal(adaptive.paceLevel(2, recs([false, false]), BKT), 1);
    assert.equal(adaptive.paceLevel(2, recs([true, false]), BKT), 2);
    assert.equal(adaptive.paceLevel(2, [], BKT), 2);
    assert.equal(adaptive.nextLevelFromMastery(1, recs([true, true])), 2);
    // it still refuses to invent a level it cannot reason about
    assert.equal(adaptive.nextLevelFromMastery(undefined, recs([true, true])), undefined);
    // and the whole session pages through on the streak rule. walk() cannot
    // be used here: it reports P(known), which is the thing that is gone.
    const history = [];
    let level = 1;
    const levels = [true, true, true, false, true, false, false, false, false]
      .map((c, i) => {
        history.push({ id: i + 1, correct: c });
        level = adaptive.paceLevel(level, history, BKT);
        return level;
      });
    assert.deepEqual(levels, [1, 2, 3, 3, 3, 3, 2, 1, 1]);
  } finally {
    bkt.masteryFromHistory = saved;
  }
  // restored, and the BKT answer is back
  assert.equal(adaptive.paceLevel(1, recs([true, true]), BKT), 1);
  assert.equal(adaptive.masteryOf(recs([true, true])).toFixed(6), '0.843952');
});

test('per-child parameters move the gate, and the walk moves with it', () => {
  // pLearn 0.3 instead of 0.15: the same two correct answers clear 0.85
  const fast = { pace: 'bkt', params: { pLearn: 0.3 } };
  assert.equal(bkt.masteryFromHistory(recs([true]), fast.params).toFixed(6), '0.631579');
  assert.equal(bkt.masteryFromHistory(recs([true, true]), fast.params).toFixed(6), '0.902390');
  let level = 1;
  const history = [];
  [true, true].forEach((c, i) => {
    history.push({ id: i + 1, correct: c });
    level = adaptive.paceLevel(level, history, fast);
  });
  assert.equal(level, 2);
  // the same two answers on the default parameters hold at 1
  assert.equal(adaptive.paceLevel(1, recs([true, true]), BKT), 1);
});
