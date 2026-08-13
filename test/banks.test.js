const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const { eligibleExercises } = require('../src/lib/adaptive');

test('every skill has items at levels 1, 2 and 3', () => {
  const cov = banks.coverage();
  banks.RM_SKILLS.forEach(([skill]) => {
    assert.ok(cov[skill].total >= 16, skill + ' too thin');
    assert.ok(cov[skill].byLevel[1] >= 4, skill + ' L1');
    assert.ok(cov[skill].byLevel[2] >= 4, skill + ' L2');
    assert.ok(cov[skill].byLevel[3] >= 4, skill + ' L3');
  });
});

test('addition and subtraction stay inside 0–20', () => {
  banks.rowsOf('addition').forEach((it) => {
    assert.ok(it.answer >= 0 && it.answer <= 20, it.prompt);
  });
  banks.rowsOf('subtraction').forEach((it) => {
    assert.ok(it.answer >= 0 && it.answer <= 20, it.prompt);
  });
});

test('counting covers next-number through 20 and a skip-count', () => {
  const prompts = banks.rowsOf('counting').map((x) => x.prompt).join('\n');
  assert.match(prompts, /19, ואז המספר הבא/);
  assert.match(prompts, /ספירה דילוגית/);
  assert.equal(banks.rowsOf('counting').find((x) => /19, ואז/.test(x.prompt)).answer, 20);
});

test('multiplication includes 2/5/10 tables and a hard 7×8', () => {
  const rows = banks.rowsOf('multiplication');
  assert.ok(rows.some((x) => x.prompt === '5 × 10 = ?' && x.answer === 50 && x.level === 1));
  const hard = rows.find((x) => x.prompt === '7 × 8 = ?');
  assert.ok(hard);
  assert.equal(hard.answer, 56);
  assert.equal(hard.level, 3);
});

test('simple fractions include half-of-a-set and quarters-in-two-wholes', () => {
  const rows = banks.rowsOf('basic_fractions');
  assert.equal(rows.find((x) => x.prompt.indexOf('חצי מתוך 12') !== -1).answer, 6);
  assert.equal(rows.find((x) => x.prompt.indexOf('כמה רבעים יש ב-2 שלמות') !== -1).answer, 8);
});

test('rows carry id, level and grade so adaptive selection can run', () => {
  const add = banks.rowsOf('addition');
  add.forEach((it) => {
    assert.match(it.id, /^addition-\d+$/);
    assert.ok(it.level >= 1 && it.level <= 3);
    assert.equal(it.grade, 'א׳–ב׳');
    assert.equal(it.he, 'חיבור');
  });
  const L2 = banks.itemsAtLevel('addition', 2);
  assert.ok(L2.length >= 4);
  assert.ok(L2.every((x) => x.level === 2));
});

test('eligibleExercises can pace a curriculum skill by level', () => {
  const bank = banks.rowsOf('addition');
  const pool = eligibleExercises(bank, [], null, 1);
  assert.ok(pool.length);
  assert.ok(pool.every((x) => x.level === 1));
  const afterTwoRight = eligibleExercises(
    bank,
    [{ id: pool[0].id, correct: true }, { id: pool[0].id, correct: true }],
    pool[0].id,
    1
  );
  assert.ok(afterTwoRight.every((x) => x.level === 2));
});

test('diagnostic first two items and hear cues are unchanged', () => {
  const d = banks.diagnosticItems();
  assert.equal(d.length, 10);
  assert.equal(d[0].prompt.indexOf('🥁🥁🥁🥁🥁') !== -1, true);
  assert.deepEqual(d[0].hear, [5]);
  const plus = banks.rowsOf('addition').find((x) => x.prompt.indexOf('3 פעימות') !== -1);
  assert.deepEqual(plus.hear, [3, 2]);
});
