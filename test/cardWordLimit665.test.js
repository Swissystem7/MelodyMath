'use strict';
// MelodyMath — 15-word guard for the templates shortened in 109f0b8 (Refs #891, Refs #665).
// Cohorts are named explicitly below; this does NOT claim all 1288 bank cards pass.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const { countWords } = require('../src/lib/exercises/patternAndWorkedExample');

const all = banks.allItems();

test('grade ג division-with-remainder cohort: prompt ≤15 words, answer is "<n> שארית <n>"', () => {
  // Cohort: grade ג, skill division, standard חילוק עם שארית (DIV_REM) only —
  // not all grade-ג division items (plain division answers are numeric).
  const cohort = all.filter(
    (i) => i.grade === 'ג' && i.skill === 'division' && i.standard === 'חילוק עם שארית'
  );
  assert.ok(cohort.length > 0, 'grade ג division-with-remainder cohort must be non-empty');
  for (const item of cohort) {
    assert.ok(
      countWords(item.prompt) <= 15,
      `${item.id}: prompt has ${countWords(item.prompt)} words (>15): ${item.prompt}`
    );
    assert.match(
      String(item.answer),
      /^\d+ שארית \d+$/,
      `${item.id}: answer must match "<n> שארית <n>", got: ${item.answer}`
    );
  }
});

test("grade ג g3.kind==='chant' cohort: prompt ≤15 words, answer equals table×pauseAt", () => {
  // Cohort: grade ג items whose g3.kind is 'chant' only.
  const cohort = all.filter((i) => i.grade === 'ג' && i.g3 && i.g3.kind === 'chant');
  assert.ok(cohort.length > 0, "grade ג g3.kind==='chant' cohort must be non-empty");
  let checkedProduct = 0;
  for (const item of cohort) {
    assert.ok(
      countWords(item.prompt) <= 15,
      `${item.id}: prompt has ${countWords(item.prompt)} words (>15): ${item.prompt}`
    );
    // Real shape: item.g3 = { kind:'chant', table, upTo, pauseAt }, item.answer is numeric.
    if (Number.isFinite(item.g3.table) && Number.isFinite(item.g3.pauseAt)) {
      checkedProduct += 1;
      assert.equal(
        Number(item.answer),
        item.g3.table * item.g3.pauseAt,
        `${item.id}: answer must equal g3.table×g3.pauseAt (${item.g3.table}×${item.g3.pauseAt})`
      );
    }
  }
  assert.ok(checkedProduct > 0, 'at least one chant item must carry numeric g3.table and g3.pauseAt');
});

test('grade ב subtraction cohort: every hint ≤15 words', () => {
  // Cohort: grade ב, skill subtraction only (all such items, every hint).
  const cohort = all.filter((i) => i.grade === 'ב' && i.skill === 'subtraction');
  assert.ok(cohort.length > 0, 'grade ב subtraction cohort must be non-empty');
  for (const item of cohort) {
    assert.equal(typeof item.hint, 'string', `${item.id}: hint must be a string`);
    assert.ok(item.hint.trim().length > 0, `${item.id}: hint must be non-empty`);
    assert.ok(
      countWords(item.hint) <= 15,
      `${item.id}: hint has ${countWords(item.hint)} words (>15): ${item.hint}`
    );
  }
});
