'use strict';
// Tests for Ministry exercise types variety in Grade א (Refs #665 req 3, Refs #670).
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const curr = require('../src/lib/curriculum');
const ext = require('../src/lib/curriculum/exerciseTypes');

test('exerciseTypes exports canonical types and helper functions', () => {
  assert.ok(Array.isArray(ext.EXERCISE_TYPES));
  assert.ok(ext.EXERCISE_TYPES.includes('missing_addend'));
  assert.ok(ext.EXERCISE_TYPES.includes('compare'));
  assert.ok(ext.EXERCISE_TYPES.includes('word_problem'));
  assert.ok(ext.EXERCISE_TYPES.includes('number_line'));
  assert.equal(typeof ext.classifyExerciseType, 'function');
  assert.equal(typeof ext.typesForTopic, 'function');
  assert.equal(typeof ext.verifyGradeTopics, 'function');
});

test('classifyExerciseType accurately identifies exercise types', () => {
  assert.equal(ext.classifyExerciseType({ exerciseType: 'missing_addend' }), 'missing_addend');
  assert.equal(ext.classifyExerciseType({ exerciseType: 'compare' }), 'compare');
  assert.equal(ext.classifyExerciseType({ prompt: '5 + ☐ = 8' }), 'missing_addend');
  assert.equal(ext.classifyExerciseType({ prompt: 'איזה מספר גדול יותר: 4 או 7?' }), 'compare');
  assert.equal(ext.classifyExerciseType({ prompt: 'בסלסילה היו 9 תפוחים ואכלנו 4 מהם.' }), 'word_problem');
  assert.equal(ext.classifyExerciseType({ widget: 'numberLine', prompt: 'קפצו על הישר' }), 'number_line');
  assert.equal(ext.classifyExerciseType({ prompt: 'ספרו את הפעימות: 🥁🥁🥁' }), 'direct');
});

test('every curriculum topic in Grade א has at least 3 distinct exercise types', () => {
  const result = ext.verifyGradeTopics('א');
  assert.equal(result.grade, 'א');
  assert.equal(result.totalTopics, 13);
  assert.equal(result.passedTopics, 13);
  assert.equal(result.allPass, true);

  result.topics.forEach((t) => {
    assert.ok(t.count >= 3, `Topic ${t.topicId || t.topic} has only ${t.count} types: ${t.types.join(', ')}`);
    assert.equal(t.pass, true);
  });
});

test('Grade א items include missing addends, comparisons, and word problems', () => {
  const g1Items = banks.itemsForGrade('א');
  const types = new Set(g1Items.map(ext.classifyExerciseType));

  assert.ok(types.has('missing_addend'), 'Missing missing_addend type in Grade א');
  assert.ok(types.has('compare'), 'Missing compare type in Grade א');
  assert.ok(types.has('word_problem'), 'Missing word_problem type in Grade א');
  assert.ok(types.has('number_line'), 'Missing number_line type in Grade א');
  assert.ok(types.has('direct'), 'Missing direct type in Grade א');
  assert.ok(types.has('representation'), 'Missing representation type in Grade א');

  // Verify all items are shippable
  g1Items.forEach((it) => {
    assert.equal(banks.isShippable(it), true, it.id + ' must be shippable');
    assert.equal(it.grade, 'א');
  });
});
