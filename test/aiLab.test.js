const test = require('node:test');
const assert = require('node:assert/strict');
const lab = require('../src/lib/aiLab');

test('AI lab has eight distinct child-safety learning scenarios', () => {
  assert.equal(lab.scenarios.length, 8);
  assert.deepEqual(lab.scenarios.map((item) => item.id), [
    'verify-arithmetic', 'better-prompt', 'private-data', 'unknown-source',
    'compare-sources', 'fact-or-opinion', 'image-check', 'human-help'
  ]);
  assert.ok(lab.scenarios.every((item) => item.choices.length >= 3));
});

test('evaluate rejects a confident wrong arithmetic answer', () => {
  assert.equal(lab.evaluate(0, 0).correct, false);
  assert.equal(lab.evaluate(0, 1).correct, true);
  assert.match(lab.evaluate(0, 1).explanation, /56/);
});

test('private details are never the correct choice', () => {
  assert.equal(lab.evaluate(2, 0).correct, false);
  assert.equal(lab.evaluate(2, 1).correct, false);
  assert.equal(lab.evaluate(2, 2).correct, true);
});

test('summary requires six correct answers and does not claim mastery', () => {
  assert.equal(lab.summarize([true, true, true, true, true, false, false, false]).passed, false);
  const passing = lab.summarize([true, true, true, true, true, true, false, false]);
  assert.equal(passing.passed, true);
  assert.equal(passing.correct, 6);
  assert.doesNotMatch(passing.message, /שולט|מומחה|מוכח/);
});
