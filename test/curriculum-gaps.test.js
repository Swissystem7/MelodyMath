const test = require('node:test');
const assert = require('node:assert');
const curriculum = require('../src/lib/curriculum');
const { gapTopicsForGrade } = curriculum;

test('gapTopicsForGrade returns only gap rows, and א׳–ו׳ no longer have one', () => {
  assert.strictEqual(typeof gapTopicsForGrade, 'function');
  assert.deepEqual(gapTopicsForGrade('א'), []);
  assert.deepEqual(gapTopicsForGrade('ב'), []);
  assert.deepEqual(gapTopicsForGrade('ג'), []);
  assert.deepEqual(gapTopicsForGrade('ד'), []);
  assert.deepEqual(gapTopicsForGrade('ה'), []);
  assert.deepEqual(gapTopicsForGrade('ו'), []);
  [].forEach((grade) => {
    const topics = gapTopicsForGrade(grade);
    assert.ok(topics.length > 0, grade);
    assert.strictEqual(topics.every((t) => t.status === 'gap' && t.grade === grade), true);
  });
});
