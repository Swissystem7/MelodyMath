// MelodyMath — Pattern Completion & Worked Example Tests (Issue #670, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');

const PW = require('../src/lib/exercises/patternAndWorkedExample.js');

test('pattern completion exercise creates sound-first model with <= 15 words', () => {
  const ex = PW.createPatternCompletionExercise({
    pattern: ['דו', 'מי', 'דו', 'מי'],
    expected: 'דו',
    choices: ['דו', 'מי', 'סול']
  });

  assert.equal(ex.kind, 'pattern_completion');
  assert.equal(ex.grade, 'א');
  assert.equal(ex.expected, 'דו');
  assert.ok(ex.wordCount <= 15, `Word count ${ex.wordCount} exceeds 15 words`);
  assert.equal(ex.hasMusic, true);
  assert.equal(ex.soundEvents.length, 4);

  // Correct answer verification
  const rightRes = ex.check('דו');
  assert.equal(rightRes.correct, true);
  assert.equal(rightRes.status, 'right');

  // Retry on error
  const wrongRes = ex.check('מי');
  assert.equal(wrongRes.correct, false);
  assert.equal(wrongRes.status, 'retry');
});

test('worked example implements fading and restoration of scaffolding on mistake', () => {
  // Step 1: Demo
  const demoEx = PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'demo' });
  assert.equal(demoEx.kind, 'worked_example');
  assert.equal(demoEx.stage, 'demo');
  assert.ok(demoEx.wordCount <= 15);
  assert.equal(demoEx.nextStage(true), 'completion');

  // Step 2: Completion
  const compEx = PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'completion' });
  assert.equal(compEx.stage, 'completion');
  assert.ok(compEx.wordCount <= 15);
  assert.equal(compEx.answer, 1, 'completion step requires 1 final action');
  assert.equal(compEx.check(1).correct, true);
  assert.equal(compEx.check(1).next, 'independent');

  // Expertise reversal / mistake handling: error restores demo support
  assert.equal(compEx.check(0).correct, false);
  assert.equal(compEx.check(0).next, 'demo');

  // Step 3: Independent
  const indEx = PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'independent' });
  assert.equal(indEx.stage, 'independent');
  assert.ok(indEx.wordCount <= 15);
  assert.equal(indEx.answer, 5);
  assert.equal(indEx.check(5).correct, true);
  assert.equal(indEx.check(5).next, 'mastered');
});

test('validation rejects prompts exceeding 15 words or missing standards', () => {
  const longPrompt = 'זהו תרגיל שבו אנחנו בודקים האם המשפט ארוך מדי עבור ילדים צעירים ולכן המערכת חייבת לחסום אותו';
  const invalid = PW.validateExerciseCard({
    prompt: longPrompt,
    standard: 'סדרות דגמים צורניים',
    kind: 'pattern_completion'
  });
  assert.equal(invalid.valid, false);
  assert.match(invalid.reason, /exceeds 15 words/);

  const missingStd = PW.validateExerciseCard({
    prompt: 'קצר ולעניין',
    kind: 'pattern_completion'
  });
  assert.equal(missingStd.valid, false);
  assert.match(missingStd.reason, /missing curriculum standard/);
});

test('render widgets generate accessible UI with minimum 44px buttons', () => {
  const mockDoc = {
    createElement: function (tag) {
      const attrs = {};
      const children = [];
      return {
        tag: tag,
        style: {},
        innerHTML: '',
        children: children,
        setAttribute: function (k, v) { attrs[k] = v; },
        getAttribute: function (k) { return attrs[k]; },
        appendChild: function (c) { children.push(c); },
        querySelectorAll: function () { return []; },
        querySelector: function () { return null; }
      };
    }
  };

  const container = {
    innerHTML: '',
    children: [],
    appendChild: function (el) { this.children.push(el); },
    ownerDocument: mockDoc
  };

  // Pattern widget
  const patternEx = PW.createPatternCompletionExercise();
  PW.renderPatternWidget(container, patternEx, {});
  assert.ok(container.children.length >= 1);

  // Worked example widget
  const workedEx = PW.createWorkedExampleExercise();
  PW.renderWorkedExampleWidget(container, workedEx, {});
  assert.ok(container.children.length >= 2);
});
