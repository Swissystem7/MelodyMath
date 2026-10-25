'use strict';
// Tests for Ministry exercise types variety in Grade ה (Refs #665 req 3, Refs #670).
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

test('every curriculum topic in Grade ה has at least 3 distinct exercise types', () => {
  const result = ext.verifyGradeTopics('ה');
  assert.equal(result.grade, 'ה');
  assert.equal(result.totalTopics, 12);
  assert.equal(result.passedTopics, 12);
  assert.equal(result.allPass, true);

  result.topics.forEach((t) => {
    assert.ok(t.count >= 3, `Topic ${t.topicId || t.topic} has only ${t.count} types: ${t.types.join(', ')}`);
    assert.equal(t.pass, true);
  });
});

test('Grade ה includes fraction expansion, decimals, triangles, and 3D solids variety', () => {
  const allG5 = ext.allExercisesForGrade('ה');
  const types = new Set(allG5.map(ext.classifyExerciseType));

  assert.ok(types.has('missing_addend'), 'Missing missing_addend in Grade ה');
  assert.ok(types.has('compare'), 'Missing compare in Grade ה');
  assert.ok(types.has('word_problem'), 'Missing word_problem in Grade ה');
  assert.ok(types.has('direct'), 'Missing direct in Grade ה');

  const fracExpTypes = ext.typesForTopic('ה', 'mm-cur-41');
  assert.ok(fracExpTypes.length >= 3, `Topic mm-cur-41 types: ${fracExpTypes.join(', ')}`);

  const decTypes = ext.typesForTopic('ה', 'mm-cur-45');
  assert.ok(decTypes.length >= 3, `Topic mm-cur-45 types: ${decTypes.join(', ')}`);

  const triTypes = ext.typesForTopic('ה', 'mm-cur-47');
  assert.ok(triTypes.length >= 3, `Topic mm-cur-47 types: ${triTypes.join(', ')}`);

  const solidTypes = ext.typesForTopic('ה', 'mm-cur-48');
  assert.ok(solidTypes.length >= 3, `Topic mm-cur-48 types: ${solidTypes.join(', ')}`);
});
