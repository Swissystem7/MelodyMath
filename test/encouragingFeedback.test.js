// MelodyMath — Encouraging feedback & retry state machine tests (Issue #680, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const fb = require('../src/lib/encouragingFeedback.js');

test('initial feedback state starts in ask phase with no error flags', () => {
  const item = { id: 'add-1', skill: 'addition', prompt: '3 + 2 = ?', answer: 5 };
  const s0 = fb.createFeedbackState(item);
  assert.equal(s0.phase, 'ask');
  assert.equal(s0.attempts, 0);
  assert.equal(s0.hasBuzzer, false);
  assert.equal(s0.hasRedX, false);
  assert.equal(s0.scoreLoss, false);
  assert.equal(s0.canRetry, false);
});

test('unit: state machine transitions wrong -> hint_replay -> retry on first mistake', () => {
  const item = { id: 'sub-1', skill: 'subtraction', prompt: '7 - 3 = ?', answer: 4 };
  const s0 = fb.createFeedbackState(item);

  // 1. Wrong answer on first attempt
  const s1 = fb.submitAnswer(s0, 2, false);
  assert.equal(s1.phase, 'hint_replay');
  assert.equal(s1.attempts, 1);
  assert.equal(s1.canRetry, true);
  assert.equal(s1.replayActive, true);
  assert.equal(s1.hasBuzzer, false, 'no buzzer on first mistake (rule 6)');
  assert.equal(s1.hasRedX, false, 'no red X on first mistake (rule 6)');
  assert.equal(s1.scoreLoss, false, 'no score loss on first mistake');
  assert.ok(s1.spokenText.length > 0, 'provides gentle spoken encouragement');
  assert.equal(s1.visualAnimation.kind, 'hint_cue');

  // 2. Transition from hint_replay to retry
  const s2 = fb.startRetry(s1);
  assert.equal(s2.phase, 'retry');
  assert.equal(s2.replayActive, false);
  assert.equal(s2.canRetry, false);
  assert.match(s2.message, /נסו שוב/);
});

test('e2e: a wrong answer then a right one completes the exercise', () => {
  const item = { id: 'frac-1', skill: 'fraction', prompt: '1/2 + 1/4 = ?', answer: '3/4' };
  const flow = fb.runExerciseFeedbackFlow(item, ['1/3', '3/4'], (ans, it) => ans === it.answer);

  assert.equal(flow.finalState.phase, 'correct');
  assert.equal(flow.finalState.attempts, 2);
  assert.equal(flow.finalState.tone, 'good');
  assert.equal(flow.finalState.hasBuzzer, false);
  assert.equal(flow.finalState.hasRedX, false);
  assert.equal(flow.finalState.scoreLoss, false);
  assert.ok(flow.finalState.visualAnimation, 'shows visual animation upon correct answer');
  assert.equal(flow.finalState.visualAnimation.kind, 'bar_split');

  // History phases: ask -> hint_replay -> retry -> correct
  const phases = flow.history.map((s) => s.phase);
  assert.deepEqual(phases, ['ask', 'hint_replay', 'retry', 'correct']);
});

test('second mistake after retry moves to soft revealed with no buzzer', () => {
  const item = { id: 'mul-1', skill: 'multiplication', prompt: '3 * 4 = ?', answer: 12 };
  const flow = fb.runExerciseFeedbackFlow(item, [9, 10], (ans, it) => ans === it.answer);

  assert.equal(flow.finalState.phase, 'revealed');
  assert.equal(flow.finalState.attempts, 2);
  assert.equal(flow.finalState.hasBuzzer, false);
  assert.equal(flow.finalState.hasRedX, false);
  assert.equal(flow.finalState.scoreLoss, false);
  assert.match(flow.finalState.spokenText, /12/);
});

test('snapshot: correct-answer visual animation exists for each exercise type (rule 2)', () => {
  const types = [
    { skill: 'addition', prompt: '2 + 5', expected: 'merge' },
    { skill: 'subtraction', prompt: '9 - 4', expected: 'takeaway' },
    { skill: 'multiplication', prompt: '3 × 6', expected: 'repeat_group' },
    { skill: 'fractions', prompt: '2/4', expected: 'bar_split' },
    { skill: 'geometry', prompt: 'היקף מלבן', expected: 'glow_total' }
  ];

  types.forEach((t) => {
    const anim = fb.getVisualMathAnimation(t);
    assert.ok(anim, 'animation must be defined for ' + t.skill);
    assert.equal(anim.kind, t.expected, 'kind matches expected for ' + t.skill);
    assert.ok(anim.className.startsWith('anim-math-'), 'has animation class');
    assert.ok(anim.label, 'has Hebrew label');
    assert.ok(anim.description, 'has Hebrew description');
  });

  // Verify full animation specs snapshot
  assert.deepEqual(fb.ANIMATION_SPECS.addition.kind, 'merge');
  assert.deepEqual(fb.ANIMATION_SPECS.subtraction.kind, 'takeaway');
  assert.deepEqual(fb.ANIMATION_SPECS.multiplication.kind, 'repeat_group');
  assert.deepEqual(fb.ANIMATION_SPECS.fractions.kind, 'bar_split');
  assert.deepEqual(fb.ANIMATION_SPECS.default.kind, 'glow_total');
});
