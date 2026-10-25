'use strict';
// Tests for Ministry exercise types variety in Grade ד (Refs #665 req 3, Refs #670).
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

test('every curriculum topic in Grade ד has at least 3 distinct exercise types', () => {
  const result = ext.verifyGradeTopics('ד');
  assert.equal(result.grade, 'ד');
  assert.equal(result.totalTopics, 7);
  assert.equal(result.passedTopics, 7);
  assert.equal(result.allPass, true);

  result.topics.forEach((t) => {
    assert.ok(t.count >= 3, `Topic ${t.topicId || t.topic} has only ${t.count} types: ${t.types.join(', ')}`);
    assert.equal(t.pass, true);
  });
});

test('Grade ד includes fractions, quadrilaterals, units, and money variety', () => {
  const allG4 = ext.allExercisesForGrade('ד');
  const types = new Set(allG4.map(ext.classifyExerciseType));

  assert.ok(types.has('missing_addend'), 'Missing missing_addend in Grade ד');
  assert.ok(types.has('compare'), 'Missing compare in Grade ד');
  assert.ok(types.has('word_problem'), 'Missing word_problem in Grade ד');
  assert.ok(types.has('number_line'), 'Missing number_line in Grade ד');
  assert.ok(types.has('direct'), 'Missing direct in Grade ד');

  const fracTypes = ext.typesForTopic('ד', 'mm-cur-32');
  assert.ok(fracTypes.length >= 3, `Topic mm-cur-32 types: ${fracTypes.join(', ')}`);

  const quadTypes = ext.typesForTopic('ד', 'mm-cur-34');
  assert.ok(quadTypes.length >= 3, `Topic mm-cur-34 types: ${quadTypes.join(', ')}`);

  const unitTypes = ext.typesForTopic('ד', 'mm-cur-35');
  assert.ok(unitTypes.length >= 3, `Topic mm-cur-35 types: ${unitTypes.join(', ')}`);

  const moneyTypes = ext.typesForTopic('ד', 'mm-cur-36');
  assert.ok(moneyTypes.length >= 3, `Topic mm-cur-36 types: ${moneyTypes.join(', ')}`);
});
