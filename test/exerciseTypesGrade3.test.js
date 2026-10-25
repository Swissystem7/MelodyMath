'use strict';
// Tests for Ministry exercise types variety in Grade ג (Refs #665 req 3, Refs #670).
const test = require('node:test');
const assert = require('node:assert/strict');
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

test('every curriculum topic in Grade ג has at least 3 distinct exercise types', () => {
  const result = ext.verifyGradeTopics('ג');
  assert.equal(result.grade, 'ג');
  assert.equal(result.totalTopics, 9);
  assert.equal(result.passedTopics, 9);
  assert.equal(result.allPass, true);

  result.topics.forEach((t) => {
    assert.ok(t.count >= 3, `Topic ${t.topicId || t.topic} has only ${t.count} types: ${t.types.join(', ')}`);
    assert.equal(t.pass, true);
  });
});

test('Grade ג includes division with remainder, comparisons, and rectangle area types', () => {
  const allG3 = ext.allExercisesForGrade('ג');
  const types = new Set(allG3.map(ext.classifyExerciseType));

  assert.ok(types.has('missing_addend'), 'Missing missing_addend / missing factor type in Grade ג');
  assert.ok(types.has('compare'), 'Missing compare type in Grade ג');
  assert.ok(types.has('word_problem'), 'Missing word_problem type in Grade ג');
  assert.ok(types.has('direct'), 'Missing direct type in Grade ג');

  // Verify division with remainder mm-cur-25 has >= 3 types
  const divRemTypes = ext.typesForTopic('ג', 'mm-cur-25');
  assert.ok(divRemTypes.length >= 3, `Topic mm-cur-25 types: ${divRemTypes.join(', ')}`);

  // Verify multiplicative comparison mm-cur-26 has >= 3 types
  const mulCompTypes = ext.typesForTopic('ג', 'mm-cur-26');
  assert.ok(mulCompTypes.length >= 3, `Topic mm-cur-26 types: ${mulCompTypes.join(', ')}`);

  // Verify rectangle area and minutes mm-cur-28 has >= 3 types
  const areaTypes = ext.typesForTopic('ג', 'mm-cur-28');
  assert.ok(areaTypes.length >= 3, `Topic mm-cur-28 types: ${areaTypes.join(', ')}`);
});
