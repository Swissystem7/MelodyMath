// MelodyMath — Exercise Types Data Tests (Task 17, Refs #665, Refs #670).
const test = require('node:test');
const assert = require('node:assert/strict');
const exerciseTypes = require('../src/lib/curriculum/exerciseTypes.js');

test('exerciseTypes defines all 7 Ministry exercise types with Hebrew labels', () => {
  const types = exerciseTypes.EXERCISE_TYPES;
  assert.equal(types.length, 7);
  assert.ok(types.includes('direct'));
  assert.ok(types.includes('missing_addend'));
  assert.ok(types.includes('missing_factor'));
  assert.ok(types.includes('compare'));
  assert.ok(types.includes('word_problem'));
  assert.ok(types.includes('number_line'));
  assert.ok(types.includes('representation'));

  types.forEach(t => {
    assert.ok(exerciseTypes.TYPE_NAMES_HE[t], `Missing Hebrew label for ${t}`);
  });
});

test('GRADE_DATA covers all 6 grades (א-ו) with >=3 exercise types per topic', () => {
  const grades = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
  grades.forEach(g => {
    assert.ok(exerciseTypes.GRADE_DATA[g], `Missing data for grade ${g}`);
    const res = exerciseTypes.verifyGradeTopics(g);
    assert.equal(res.allPass, true, `Grade ${g} failed coverage: ${res.passedTopics}/${res.totalTopics} passed`);
    assert.ok(res.totalTopics >= 7, `Grade ${g} must have at least 7 topics`);
    res.topics.forEach(t => {
      assert.ok(t.count >= 3, `Topic ${t.topicId} in grade ${g} has ${t.count} types (must be >= 3)`);
    });
  });
});

test('every topic maps to a musical method with valid string description', () => {
  ['א', 'ב', 'ג', 'ד', 'ה', 'ו'].forEach(g => {
    const list = exerciseTypes.GRADE_DATA[g];
    list.forEach(t => {
      const music = exerciseTypes.musicalMethodForTopic(t.topicId);
      assert.ok(music && typeof music === 'string', `Missing musical method for topic ${t.topicId}`);
    });
  });
});

test('classifyExerciseType classifies prompts accurately', () => {
  assert.equal(exerciseTypes.classifyExerciseType({ prompt: '4 + ☐ = 10' }), 'missing_addend');
  assert.equal(exerciseTypes.classifyExerciseType({ prompt: '3 × ☐ = 21' }), 'missing_factor');
  assert.equal(exerciseTypes.classifyExerciseType({ prompt: 'איזה מספר גדול יותר: 7 או 5?' }), 'compare');
  assert.equal(exerciseTypes.classifyExerciseType({ prompt: 'דני קנה 3 תפוחים' }), 'word_problem');
  assert.equal(exerciseTypes.classifyExerciseType({ widget: 'numberLine', prompt: 'סמנו נקודה' }), 'number_line');
  assert.equal(exerciseTypes.classifyExerciseType({ prompt: 'התבוננו בלוח המאה' }), 'representation');
  assert.equal(exerciseTypes.classifyExerciseType({ prompt: 'חשבו: 3 + 4' }), 'direct');
});
