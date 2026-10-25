'use strict';
// Tests for Ministry exercise types variety in Grade ו (Refs #665 req 3, Refs #670).
const test = require('node:test');
const assert = require('node:assert/strict');
const ext = require('../src/lib/curriculum/exerciseTypes');

test('exerciseTypes exports canonical types and helper functions', () => {
  assert.ok(Array.isArray(ext.EXERCISE_TYPES));
  assert.ok(ext.EXERCISE_TYPES.includes('missing_addend'));
  assert.ok(ext.EXERCISE_TYPES.includes('compare'));
  assert.ok(ext.EXERCISE_TYPES.includes('word_problem'));
  assert.ok(ext.EXERCISE_TYPES.includes('representation'));
  assert.equal(typeof ext.classifyExerciseType, 'function');
  assert.equal(typeof ext.typesForTopic, 'function');
  assert.equal(typeof ext.verifyGradeTopics, 'function');
});

test('every curriculum topic in Grade ו has at least 3 distinct exercise types', () => {
  const result = ext.verifyGradeTopics('ו');
  assert.equal(result.grade, 'ו');
  assert.equal(result.totalTopics, 9);
  assert.equal(result.passedTopics, 9);
  assert.equal(result.allPass, true);

  result.topics.forEach((t) => {
    assert.ok(t.count >= 3, `Topic ${t.topicId || t.topic} has only ${t.count} types: ${t.types.join(', ')}`);
    assert.equal(t.pass, true);
  });
});

test('Grade ו includes volume, percentages, circle geometry, and averages variety', () => {
  const allG6 = ext.allExercisesForGrade('ו');
  const types = new Set(allG6.map(ext.classifyExerciseType));

  assert.ok(types.has('missing_addend'), 'Missing missing_addend in Grade ו');
  assert.ok(types.has('compare'), 'Missing compare in Grade ו');
  assert.ok(types.has('word_problem'), 'Missing word_problem in Grade ו');
  assert.ok(types.has('representation'), 'Missing representation in Grade ו');
  assert.ok(types.has('direct'), 'Missing direct in Grade ו');

  const volTypes = ext.typesForTopic('ו', 'mm-cur-56');
  assert.ok(volTypes.length >= 3, `Topic mm-cur-56 types: ${volTypes.join(', ')}`);

  const pctTypes = ext.typesForTopic('ו', 'mm-cur-53');
  assert.ok(pctTypes.length >= 3, `Topic mm-cur-53 types: ${pctTypes.join(', ')}`);

  const circTypes = ext.typesForTopic('ו', 'mm-cur-54');
  assert.ok(circTypes.length >= 3, `Topic mm-cur-54 types: ${circTypes.join(', ')}`);

  const avgTypes = ext.typesForTopic('ו', 'mm-cur-57');
  assert.ok(avgTypes.length >= 3, `Topic mm-cur-57 types: ${avgTypes.join(', ')}`);
});
