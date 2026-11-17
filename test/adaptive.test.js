const test = require('node:test');
const assert = require('node:assert/strict');
const { nextLevel, isCorrect, isWithinTolerance, normalizeAnswer, eligibleExercises, MIN_LEVEL, MAX_LEVEL } = require('../src/lib/adaptive');

test('isWithinTolerance accepts a close estimate and rejects far or non-numeric answers', () => {
  assert.equal(isWithinTolerance('35', 37, 4), true);
  assert.equal(isWithinTolerance('41', 37, 4), true);
  assert.equal(isWithinTolerance('31', 37, 4), false);
  assert.equal(isWithinTolerance('abc', 37, 4), false);
  assert.equal(isWithinTolerance('', 37, 4), false);
  assert.equal(isWithinTolerance('0x10', 16, 4), false);
  assert.equal(isCorrect('35', 37), false, 'isCorrect stays exact');
});

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

test('hex, exponent and binary spellings do not pass as the number they encode', () => {
  assert.equal(isCorrect('0x10', '16'), false);
  assert.equal(isCorrect('1e1', '10'), false);
  assert.equal(isCorrect('0b11', '3'), false);
  assert.equal(isCorrect('0o7', '7'), false);
  assert.equal(isCorrect('+5', '5'), true);
  assert.equal(isCorrect('3.', '3'), true);
  assert.equal(isCorrect('.75', '0.75'), true);
  assert.equal(isCorrect('-2,5', '-2.5'), true);
});

test('prolonged error streak: step-by-step nextLevel drops and clamps at MIN_LEVEL', () => {
  let level = MAX_LEVEL; // start at 3
  const expectedLevels = [3, 2, 1, 1, 1, 1, 1]; // turn 1: 1 wrong (holds), turn 2: 2 wrong (drops to 2), turn 3: drops to 1, turn 4+: clamps at 1
  const answers = [];

  for (let turn = 0; turn < expectedLevels.length; turn++) {
    answers.push(wrong);
    level = nextLevel(level, answers.slice(-2));
    assert.equal(level, expectedLevels[turn], `Turn ${turn + 1} expected level ${expectedLevels[turn]} but got ${level}`);
    assert.ok(level >= MIN_LEVEL, `Level ${level} must not fall below MIN_LEVEL (${MIN_LEVEL})`);
    assert.ok(level <= MAX_LEVEL, `Level ${level} must not exceed MAX_LEVEL (${MAX_LEVEL})`);
  }
  assert.equal(level, MIN_LEVEL);
});

test('prolonged error streak: eligibleExercises clamps at MIN_LEVEL, prioritizes missed items for retry, and bounds accuracy rate', () => {
  const multiLevelBank = [
    { id: 'item_1a', level: 1 },
    { id: 'item_1b', level: 1 },
    { id: 'item_1c', level: 1 },
    { id: 'item_2a', level: 2 },
    { id: 'item_2b', level: 2 },
    { id: 'item_3a', level: 3 },
    { id: 'item_3b', level: 3 },
  ];

  // 6 consecutive wrong answers across items
  const errorHistory = [
    { id: 'item_3a', correct: false },
    { id: 'item_3b', correct: false },
    { id: 'item_2a', correct: false },
    { id: 'item_1a', correct: false },
    { id: 'item_1b', correct: false },
    { id: 'item_1c', correct: false },
  ];

  const accuracyRate = errorHistory.filter((h) => h.correct).length / errorHistory.length;
  assert.equal(accuracyRate, 0.0);
  assert.ok(accuracyRate >= 0 && accuracyRate <= 1, 'Accuracy rate must be bounded within [0, 1]');

  // In eligibleExercises: last question was item_1c (level 1), lastTwo are errors.
  const pool = eligibleExercises(multiLevelBank, errorHistory, 'item_1c', MIN_LEVEL);

  // Pool must be non-empty and strictly at MIN_LEVEL
  assert.ok(pool.length > 0, 'Candidate pool should not be empty');
  assert.ok(pool.every((item) => item.level === MIN_LEVEL), 'Chosen level must remain clamped at MIN_LEVEL (1)');

  // Missed items (item_1a, item_1b) must stay in pool and be prioritized for retry (excluding lastId item_1c)
  const poolIds = pool.map((item) => item.id);
  assert.ok(poolIds.includes('item_1a'), 'Missed item_1a should be prioritized in pool');
  assert.ok(poolIds.includes('item_1b'), 'Missed item_1b should be prioritized in pool');
  assert.ok(!poolIds.includes('item_1c'), 'Last item item_1c should not be immediately repeated when others exist');
});

test('rapid success streak: step-by-step nextLevel advances and clamps at MAX_LEVEL', () => {
  let level = MIN_LEVEL; // start at 1
  const expectedLevels = [1, 2, 3, 3, 3, 3, 3]; // turn 1: 1 right (holds), turn 2: 2 right (advances to 2), turn 3: advances to 3, turn 4+: clamps at 3
  const answers = [];

  for (let turn = 0; turn < expectedLevels.length; turn++) {
    answers.push(right);
    level = nextLevel(level, answers.slice(-2));
    assert.equal(level, expectedLevels[turn], `Turn ${turn + 1} expected level ${expectedLevels[turn]} but got ${level}`);
    assert.ok(level >= MIN_LEVEL, `Level ${level} must not fall below MIN_LEVEL (${MIN_LEVEL})`);
    assert.ok(level <= MAX_LEVEL, `Level ${level} must not exceed MAX_LEVEL (${MAX_LEVEL})`);
  }
  assert.equal(level, MAX_LEVEL);
});

test('rapid success streak: eligibleExercises selects candidate pool at MAX_LEVEL, drops mastered items, and bounds accuracy rate', () => {
  const multiLevelBank = [
    { id: 'q1_a', level: 1 },
    { id: 'q1_b', level: 1 },
    { id: 'q2_a', level: 2 },
    { id: 'q2_b', level: 2 },
    { id: 'q3_a', level: 3 },
    { id: 'q3_b', level: 3 },
    { id: 'q3_c', level: 3 },
    { id: 'q3_d', level: 3 },
  ];

  // 6 consecutive correct answers
  const successHistory = [
    { id: 'q1_a', correct: true },
    { id: 'q1_b', correct: true },
    { id: 'q2_a', correct: true },
    { id: 'q2_b', correct: true },
    { id: 'q3_a', correct: true },
    { id: 'q3_b', correct: true },
  ];

  const accuracyRate = successHistory.filter((h) => h.correct).length / successHistory.length;
  assert.equal(accuracyRate, 1.0);
  assert.ok(accuracyRate >= 0 && accuracyRate <= 1, 'Accuracy rate must be bounded within [0, 1]');

  const pool = eligibleExercises(multiLevelBank, successHistory, 'q3_b', MAX_LEVEL);

  // Mastered items must drop out
  const masteredIds = successHistory.filter((h) => h.correct).map((h) => h.id);
  assert.ok(pool.length > 0, 'Candidate pool should not be empty');
  for (const item of pool) {
    assert.ok(!masteredIds.includes(item.id), `Mastered item ${item.id} should have dropped out of pool`);
  }

  // Candidate pool selects at MAX_LEVEL (remaining unmastered level 3 items: q3_c, q3_d)
  assert.ok(pool.every((item) => item.level === MAX_LEVEL), 'Candidate pool must select at MAX_LEVEL (3)');
  assert.deepEqual(pool.map((item) => item.id).sort(), ['q3_c', 'q3_d']);
});

test('mixed recovery transition: 5 errors followed by 5 successes keeps level and accuracy bounded at every turn', () => {
  let level = MAX_LEVEL; // start at 3
  const sequence = [
    ...Array(5).fill(wrong), // 5 errors
    ...Array(5).fill(right), // 5 successes
  ];

  const history = [];
  const expectedLevels = [
    3, // turn 1: [wrong] -> holds at 3
    2, // turn 2: [wrong, wrong] -> drops to 2
    1, // turn 3: [wrong, wrong] -> drops to 1
    1, // turn 4: [wrong, wrong] -> clamps at 1
    1, // turn 5: [wrong, wrong] -> clamps at 1
    1, // turn 6: [wrong, right] -> mixed holds at 1
    2, // turn 7: [right, right] -> advances to 2
    3, // turn 8: [right, right] -> advances to 3
    3, // turn 9: [right, right] -> clamps at 3
    3, // turn 10: [right, right] -> clamps at 3
  ];

  for (let turn = 0; turn < sequence.length; turn++) {
    history.push({ id: `item_${turn + 1}`, correct: sequence[turn].correct });
    level = nextLevel(level, history.slice(-2));

    const correctCount = history.filter((h) => h.correct).length;
    const accuracyRate = correctCount / history.length;

    assert.equal(level, expectedLevels[turn], `Turn ${turn + 1} expected level ${expectedLevels[turn]} but got ${level}`);
    assert.ok(level >= MIN_LEVEL && level <= MAX_LEVEL, `Turn ${turn + 1}: level ${level} must stay within [${MIN_LEVEL}, ${MAX_LEVEL}]`);
    assert.ok(accuracyRate >= 0.0 && accuracyRate <= 1.0, `Turn ${turn + 1}: running accuracy rate ${accuracyRate} must stay within [0, 1]`);
  }

  // Final assertions after 5 errors + 5 successes
  assert.equal(level, MAX_LEVEL);
  const finalAccuracy = history.filter((h) => h.correct).length / history.length;
  assert.equal(finalAccuracy, 0.5);
});

test('boundary guard: nextLevel handles out-of-range, NaN, and malformed history safely', () => {
  assert.equal(nextLevel(NaN, [right, right]), 2);
  assert.equal(nextLevel(99, [right, right]), MAX_LEVEL);
  assert.equal(nextLevel(-5, [wrong, wrong]), MIN_LEVEL);
  assert.equal(nextLevel(2, null), 2);
  assert.equal(nextLevel(2, [null, null]), 2);
});

test('boundary guard: eligibleExercises handles NaN/invalid chosenLevel and malformed history gracefully', () => {
  const sampleBank = [
    { id: 'a1', level: 1 },
    { id: 'b1', level: 2 },
    { id: 'c1', level: 3 }
  ];
  const pool = eligibleExercises(sampleBank, [null, { id: 'a1', correct: false }], 'a1', NaN);
  assert.ok(Array.isArray(pool));
  assert.ok(pool.length > 0);
  assert.ok(pool.every((item) => item.level >= MIN_LEVEL && item.level <= MAX_LEVEL));
});

test('boundary guard: extreme rapid success and error sequences clamp level strictly within MIN_LEVEL and MAX_LEVEL', () => {
  let lvl = 2;
  for (let i = 0; i < 50; i++) {
    lvl = nextLevel(lvl, [right, right]);
    assert.ok(lvl >= MIN_LEVEL && lvl <= MAX_LEVEL);
  }
  assert.equal(lvl, MAX_LEVEL);

  for (let i = 0; i < 50; i++) {
    lvl = nextLevel(lvl, [wrong, wrong]);
    assert.ok(lvl >= MIN_LEVEL && lvl <= MAX_LEVEL);
  }
  assert.equal(lvl, MIN_LEVEL);
});
