'use strict';
// MelodyMath — Permanent CI Regression Guard (Refs #665).
//
// Fails if any of the 7 Ministry exercise types, balanceBars, or fractions > 1 disappear.
// Coordinated with Cursor PR #736 (does NOT duplicate its progression guards).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const banks = require('../src/lib/banks');
const fb = require('../src/lib/music/fractionBar');
const pad = require('../src/components/FractionBarPad');
const g1 = require('../src/lib/curriculum/grade1');
const g2 = require('../src/lib/curriculum/grade2');
const g4 = require('../src/lib/curriculum/grade4');
const g5 = require('../src/lib/curriculum/grade5');

const REQUIRED_EXERCISE_TYPES = [
  'direct',
  'missing_addend',
  'missing_factor',
  'compare',
  'word_problem',
  'number_line',
  'representation',
];

function classifyExerciseItem(it) {
  if (!it || typeof it !== 'object') return 'direct';
  if (it.exerciseType && REQUIRED_EXERCISE_TYPES.includes(it.exerciseType)) return it.exerciseType;
  const p = String(it.prompt || '');
  if (/[×*·]\s*☐|☐\s*[×*·]|גורם חסר/.test(p) || it.exerciseType === 'missing_factor') return 'missing_factor';
  if (it.wordType || it.skill === 'word_problems' || /היו|נשארו|קנינו|לכיתה|ספרים|תפוחים|מדבקות|בסלסילה|על המדף|ילדים|בלונים|שילם|חסכה|עודף/.test(p)) return 'word_problem';
  if (it.widget === 'numberLine' || it.line || it.skill === 'number_line' || /ישר המספרים|קפיצ/.test(p)) return 'number_line';
  if (/☐|\?.*\+|\+.*\?|חסר|השלם|מחובר/.test(p)) return 'missing_addend';
  if (/[><=]|השוו|גדול|קטן|שווה|בכמה|פי כמה|לעומת|מול|האם.*שווים|יותר.*מ|פחות.*מ/.test(p)) return 'compare';
  if (it.chart || it.clock || it.ruler || /לוח המאה|סדרות|דגם|צורות|מצולע|שעון|סרגל|מדיד|מטבע|פיקטוגרם|דיאגרמ/.test(p)) return 'representation';
  return 'direct';
}

test('CI guard: all 7 Ministry exercise types are actively represented in curriculum banks (Refs #665)', () => {
  const allItems = banks.allItems();
  const counts = {};
  REQUIRED_EXERCISE_TYPES.forEach((type) => { counts[type] = 0; });

  for (const it of allItems) {
    const t = classifyExerciseItem(it);
    counts[t] = (counts[t] || 0) + 1;
  }

  // Fails if any of the 7 types is missing from banks
  REQUIRED_EXERCISE_TYPES.forEach((type) => {
    assert.ok(counts[type] > 0, 'Exercise type ' + type + ' must have active items in banks');
  });

  // Verify baseline coverage thresholds across banks
  assert.ok(counts.direct >= 500, 'direct exercise count dropped below baseline');
  assert.ok(counts.missing_addend >= 100, 'missing_addend exercise count dropped below baseline');
  assert.ok(counts.missing_factor >= 10, 'missing_factor exercise count dropped below baseline');
  assert.ok(counts.compare >= 250, 'compare exercise count dropped below baseline');
  assert.ok(counts.word_problem >= 100, 'word_problem exercise count dropped below baseline');
  assert.ok(counts.number_line >= 30, 'number_line exercise count dropped below baseline');
  assert.ok(counts.representation >= 80, 'representation exercise count dropped below baseline');
});

test('CI guard: exerciseTypes module exports exactly the 7 required types when present (Refs #665)', () => {
  const modPath = path.join(__dirname, '../src/lib/curriculum/exerciseTypes.js');
  if (!fs.existsSync(modPath)) return;

  const et = require(modPath);
  assert.ok(Array.isArray(et.EXERCISE_TYPES), 'EXERCISE_TYPES must be exported as an array');
  assert.equal(et.EXERCISE_TYPES.length, 7, 'Must have exactly 7 exercise types');
  REQUIRED_EXERCISE_TYPES.forEach((type) => {
    assert.ok(et.EXERCISE_TYPES.includes(type), 'EXERCISE_TYPES must include ' + type);
    assert.ok(et.TYPE_NAMES_HE[type], 'TYPE_NAMES_HE must have Hebrew name for ' + type);
  });

  // Verify classifier on canonical prompts
  assert.equal(et.classifyExerciseType({ prompt: '2 + 3 = ?' }), 'direct');
  assert.equal(et.classifyExerciseType({ prompt: '5 + ☐ = 12' }), 'missing_addend');
  assert.equal(et.classifyExerciseType({ prompt: '7 × ☐ = 42' }), 'missing_factor');
  assert.equal(et.classifyExerciseType({ prompt: '14 ☐ 18 (כתבו < או >)' }), 'compare');
  assert.equal(et.classifyExerciseType({ prompt: 'דני קנה 3 מחברות' }), 'word_problem');
  assert.equal(et.classifyExerciseType({ widget: 'numberLine', prompt: 'על ישר המספרים' }), 'number_line');
  assert.equal(et.classifyExerciseType({ clock: true, prompt: 'מה השעה?' }), 'representation');
});

test('CI guard: balanceBars and fillBar are preserved across banks and music ways (Refs #665, Refs #713)', () => {
  assert.equal(banks.mechanismOf('balanceBars'), 'M3', 'balanceBars must be mechanism M3');
  assert.equal(banks.mechanismOf('fillBar'), 'M3', 'fillBar must be mechanism M3');

  const allItems = banks.allItems();
  const bbItems = allItems.filter((it) => it.music === 'balanceBars');
  const fbItems = allItems.filter((it) => it.music === 'fillBar');

  assert.ok(bbItems.length >= 20, 'balanceBars items must not be deleted from banks');
  assert.ok(fbItems.length >= 30, 'fillBar items must not be deleted from banks');

  // Grades 1 and 2 equality ways
  assert.ok(g1.music.EQ_LEFT.some((w) => w[0] === 'balanceBars'), 'Grade 1 EQ_LEFT lost balanceBars');
  assert.ok(g2.music.EQ_LEFT.some((w) => w[0] === 'balanceBars'), 'Grade 2 EQ_LEFT lost balanceBars');

  // Grades 4 and 5 equations and inequalities ways
  assert.ok(g4.music.EQ_INEQ.some((w) => w[0] === 'balanceBars'), 'Grade 4 EQ_INEQ lost balanceBars');
  assert.ok(g4.music.EQ_INEQ.some((w) => w[0] === 'fillBar'), 'Grade 4 EQ_INEQ lost fillBar');
  assert.ok(g5.music.EQ_INEQ.some((w) => w[0] === 'balanceBars'), 'Grade 5 EQ_INEQ lost balanceBars');
  assert.ok(g5.music.EQ_INEQ.some((w) => w[0] === 'fillBar'), 'Grade 5 EQ_INEQ lost fillBar');
});

test('CI guard: fractions > 1 span multiple bars and mixed number support is preserved (Refs #665, Refs #723)', () => {
  assert.equal(fb.decimalToBarFraction(1.5), '3/2');
  assert.equal(fb.decimalToBarFraction(2.25), '9/4');
  assert.equal(fb.barFractionToDecimal('3/2'), 1.5);
  assert.ok(fb.barFractionToDecimal('3/2') > 1, '3/2 must be strictly greater than 1');

  const check = fb.checkFill(['whole', 'half'], 1.5);
  assert.equal(check.status, 'exact');
  assert.equal(check.sum, '3/2');
  assert.equal(check.diff, '0');

  assert.equal(fb.toMixed('3/2'), '1 1/2');
  assert.equal(fb.toMixed('3/2', { hebrew: true }), '1 ו־1/2');

  const padEx = pad.EXERCISES.find((e) => e.target === '1.5');
  assert.ok(padEx, 'FractionBarPad must retain the multi-bar 1.5 exercise');
  assert.equal(fb.decimalToBarFraction(padEx.target), '3/2');

  const mixedItems = banks.itemsForGrade('ד').filter((it) => it.standard === banks.ST.FRAC_MIXED_D);
  assert.ok(mixedItems.length >= 1, 'Grade ד must contain mixed fraction items');
  mixedItems.forEach((it) => assert.equal(it.music, 'fillBar', it.id + ' must use fillBar'));
});
