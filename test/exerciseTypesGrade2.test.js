'use strict';
// Tests for Ministry exercise types variety in Grade ב (Refs #665 req 3, Refs #670).
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

test('every curriculum topic in Grade ב has at least 3 distinct exercise types', () => {
  const result = ext.verifyGradeTopics('ב');
  assert.equal(result.grade, 'ב');
  assert.equal(result.totalTopics, 9);
  assert.equal(result.passedTopics, 9);
  assert.equal(result.allPass, true);

  result.topics.forEach((t) => {
    assert.ok(t.count >= 3, `Topic ${t.topicId || t.topic} has only ${t.count} types: ${t.types.join(', ')}`);
    assert.equal(t.pass, true);
  });
});

test('Grade ב includes missing factor, comparison, and word problem exercise types', () => {
  const allG2 = ext.allExercisesForGrade('ב');
  const types = new Set(allG2.map(ext.classifyExerciseType));

  assert.ok(types.has('missing_addend'), 'Missing missing_addend / missing factor type in Grade ב');
  assert.ok(types.has('compare'), 'Missing compare type in Grade ב');
  assert.ok(types.has('word_problem'), 'Missing word_problem type in Grade ב');
  assert.ok(types.has('direct'), 'Missing direct type in Grade ב');

  // Verify multiplication topic mm-cur-15 has >= 3 types
  const multTypes = ext.typesForTopic('ב', 'mm-cur-15');
  assert.ok(multTypes.length >= 3, `Multiplication topic mm-cur-15 types: ${multTypes.join(', ')}`);

  // Verify division topic mm-cur-16 has >= 3 types
  const divTypes = ext.typesForTopic('ב', 'mm-cur-16');
  assert.ok(divTypes.length >= 3, `Division topic mm-cur-16 types: ${divTypes.join(', ')}`);

  // Verify geometry topic mm-cur-17 has >= 3 types
  const geoTypes = ext.typesForTopic('ב', 'mm-cur-17');
  assert.ok(geoTypes.length >= 3, `Geometry topic mm-cur-17 types: ${geoTypes.join(', ')}`);
});
