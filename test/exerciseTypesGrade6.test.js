'use strict';
// Tests for Ministry exercise types variety in Grade ו (Refs #665 req 3, Refs #670).
const test = require('node:test');
const assert = require('node:assert/strict');
const ext = require('../src/lib/curriculum/exerciseTypes');
const prog = require('../src/lib/curriculum/progression');

test('exerciseTypes exports canonical types and helper functions', () => {
  assert.ok(Array.isArray(ext.EXERCISE_TYPES));
  ['missing_addend', 'missing_factor', 'compare', 'word_problem', 'representation'].forEach(t => assert.ok(ext.EXERCISE_TYPES.includes(t)));
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
  result.topics.forEach(t => {
    assert.ok(t.count >= 3, `Topic ${t.topicId} has only ${t.count} types`);
    assert.equal(t.pass, true);
  });
});

test('exercises exist for all 9 Grade ו curriculum topics (mm-cur-50 to mm-cur-58)', () => {
  for (let i = 50; i <= 58; i++) {
    assert.ok(ext.GRADE_DATA['ו'].some(it => it.topicId === 'mm-cur-' + i), 'Missing mm-cur-' + i);
  }
});

test('pedagogical progression alignment: skip-counting, add20, perimeter prereq, missing factor, and music link', () => {
  assert.equal(ext.GRADE_DATA['א'].some(it => it.prompt.includes('דילוגים של 5')), false);
  assert.equal(ext.GRADE_DATA['ב'].some(it => it.prompt.includes('דילוגים של 5')), true);
  assert.ok(ext.GRADE_DATA['א'].some(it => it.topicId === 'mm-cur-3'));
  assert.ok(prog.PREREQ['mm-cur-18'][0].includes('mm-cur-16'));
  assert.equal(ext.classifyExerciseType({ prompt: '70 × ☐ = 700. מהו המספר החסר?' }), 'missing_factor');
  ['א', 'ב', 'ג', 'ד', 'ה', 'ו'].forEach(g => {
    ext.GRADE_DATA[g].forEach(it => {
      assert.equal(it.musicStage, 'post_music_check');
      assert.ok(typeof it.musicalMethod === 'string' && it.musicalMethod.length > 0);
    });
  });
});
