// MelodyMath — Encouraging feedback & retry state machine tests (Issue #680, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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
  assert.equal(s0.canPlaySound, true);
});

test('unit: state machine transitions wrong -> hint_replay -> retry on first mistake and triggers replay', () => {
  const item = { id: 'sub-1', skill: 'subtraction', prompt: '7 - 3 = ?', answer: 4 };
  const s0 = fb.createFeedbackState(item);

  let replayedItem = null;
  // 1. Wrong answer on first attempt
  const s1 = fb.submitAnswer(s0, 2, false, {
    onReplay: (it) => { replayedItem = it; }
  });
  assert.equal(s1.phase, 'hint_replay');
  assert.equal(s1.attempts, 1);
  assert.equal(s1.canRetry, true);
  assert.equal(s1.replayActive, true);
  assert.equal(s1.hasBuzzer, false, 'no buzzer on first mistake (rule 6)');
  assert.equal(s1.hasRedX, false, 'no red X on first mistake (rule 6)');
  assert.equal(s1.scoreLoss, false, 'no score loss on first mistake');
  assert.ok(s1.spokenText.length > 0, 'provides gentle spoken encouragement');
  assert.equal(s1.visualAnimation.kind, 'hint_cue');
  assert.equal(replayedItem, item, 'onReplay callback receives the item');

  // 2. Transition from hint_replay to retry
  const s2 = fb.startRetry(s1);
  assert.equal(s2.phase, 'retry');
  assert.equal(s2.replayActive, false);
  assert.equal(s2.canRetry, false);
  assert.match(s2.message, /נסו שוב/);
});

test('no-music check (#718): hint_replay never plays sound or activates audio replay', () => {
  const silentItem = { id: 'check-1', skill: 'addition', prompt: '4 + 2 = ?', answer: 6, noMusic: true };
  const s0 = fb.createFeedbackState(silentItem);
  assert.equal(s0.canPlaySound, false);

  let played = false;
  const s1 = fb.submitAnswer(s0, 5, false, {
    onReplay: () => { played = true; }
  });
  assert.equal(s1.phase, 'hint_replay');
  assert.equal(s1.replayActive, false, 'audio replay must remain inactive during no-music checks');
  assert.equal(played, false, 'sound replay callback must not be invoked');
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

test('snapshot: correct-answer visual animation distinguishes operations including division (rule 2)', () => {
  const types = [
    { skill: 'addition', prompt: '2 + 5', expected: 'merge' },
    { skill: 'subtraction', prompt: '9 - 4', expected: 'takeaway' },
    { skill: 'multiplication', prompt: '3 × 6', expected: 'repeat_group' },
    { skill: 'division', prompt: '12 ÷ 3', expected: 'partition' },
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

  assert.deepEqual(fb.ANIMATION_SPECS.addition.kind, 'merge');
  assert.deepEqual(fb.ANIMATION_SPECS.subtraction.kind, 'takeaway');
  assert.deepEqual(fb.ANIMATION_SPECS.multiplication.kind, 'repeat_group');
  assert.deepEqual(fb.ANIMATION_SPECS.division.kind, 'partition');
  assert.deepEqual(fb.ANIMATION_SPECS.fractions.kind, 'bar_split');
  assert.deepEqual(fb.ANIMATION_SPECS.default.kind, 'glow_total');
});

test('index.html integrates encouraging feedback into practice check()', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('src/lib/encouragingFeedback.js'), 'script is loaded');
  assert.ok(indexHtml.includes('!correct&&current&&!current._retryDone'), 'first mistake gives retry');
  assert.ok(indexHtml.includes('feedback soft'), 'applies soft feedback class');
});

test('division detection does not match clock times like 10:30 or punctuation colons (#722, Refs #591)', () => {
  const clockItem1 = { topic: 'mm-cur-28', skill: 'measurement', prompt: 'השעון מראה 10:30. מה השעה?' };
  const clockItem2 = { skill: 'measurement', prompt: '10:30' };
  const clockItem3 = { skill: 'time', prompt: 'האימון התחיל ב־4:30 ונגמר ב־6:00. כמה דקות נמשך?' };
  const punctItem1 = { skill: 'counting', prompt: 'סִפרו: 🥁🥁🥁 — כמה יש?' };
  const punctItem2 = { skill: 'addition', prompt: 'חשבו במאונך: 47 + 25' };
  const divItem1 = { prompt: '12 : 3 = ?' };
  const divItem2 = { prompt: '84 : 4' };
  const divItem3 = { skill: 'division', prompt: 'כמה קבוצות של 3 יש ב־12?' };

  assert.notEqual(fb.getVisualMathAnimation(clockItem1).kind, 'partition', '10:30 in sentence is not division');
  assert.notEqual(fb.getVisualMathAnimation(clockItem2).kind, 'partition', 'bare 10:30 is not division');
  assert.notEqual(fb.getVisualMathAnimation(clockItem3).kind, 'partition', 'clock range 4:30 to 6:00 is not division');
  assert.notEqual(fb.getVisualMathAnimation(punctItem1).kind, 'partition', 'counting prompt colon is not division');
  assert.equal(fb.getVisualMathAnimation(punctItem2).kind, 'merge', 'vertical addition is addition');
  assert.equal(fb.getVisualMathAnimation(divItem1).kind, 'partition', '12 : 3 = ? is division');
  assert.equal(fb.getVisualMathAnimation(divItem2).kind, 'partition', '84 : 4 is division');
  assert.equal(fb.getVisualMathAnimation(divItem3).kind, 'partition', 'explicit division skill is division');
});

test('mistake replays sound via maybeHear for current exercise only (#722, 0h, Refs #665)', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('maybeHear(current)'), 'check() triggers sound replay on first mistake');
  assert.ok(indexHtml.includes('#quiz:not(.hidden)'), 'maybeHear scopes to current active exercise container');
  assert.ok(indexHtml.includes('np-btn'), 'maybeHear falls back to playing active sound button if no hear array');
});

test('snapshot: every correct-answer animation class has CSS keyframes and a reduced-motion opt-out (#680)', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'jam.css'), 'utf8');
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion:reduce)'));
  Object.values(fb.ANIMATION_SPECS).forEach((spec) => {
    const rule = css.match(new RegExp('\\.' + spec.className + '\\{animation:(\\w+)'));
    assert.ok(rule, spec.className + ' has an animation rule');
    assert.ok(css.includes('@keyframes ' + rule[1]), spec.className + ' keyframes exist');
    assert.match(reduced, new RegExp('\\.' + spec.className + '[,{]'),spec.className + ' respects reduced motion');
  });
});
