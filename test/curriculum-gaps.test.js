const test = require('node:test');
const assert = require('node:assert');
const curriculum = require('../src/lib/curriculum');
const { gapTopicsForGrade } = curriculum;

test("gapTopicsForGrade('א') returns an array where every topic has a status of 'gap'", () => {
  assert.strictEqual(typeof gapTopicsForGrade, 'function');
  const topics = gapTopicsForGrade('א');
  assert.ok(Array.isArray(topics));
  assert.ok(topics.length > 0);
  assert.strictEqual(topics.every((t) => t.status === 'gap'), true);
  for (const topic of topics) {
    assert.strictEqual(topic.grade, 'א');
    assert.strictEqual(topic.status, 'gap');
  }
});
