'use strict';
// MelodyMath — Unit tests for core exercise logic & audio playback scheduling (#665 automated tests).
// Ref #665.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const adaptive = require('../src/lib/adaptive');
const fb = require('../src/lib/encouragingFeedback');
const ex = require('../src/lib/exercises/explorerBank');
const NP = require('../src/components/NumberPlay');
const takeAwayTen = require('../src/lib/music/takeAwayTen');
const PM = require('../src/lib/music/percentMix');

test('core exercise logic: exercise generation across banks', () => {
  const items = banks.allItems();
  assert.ok(items.length > 0, 'bank items should exist');

  // Verify every item has required core fields
  items.forEach((item) => {
    assert.ok(item.prompt, 'item must have prompt');
    assert.notEqual(item.answer, undefined, 'item must have answer');
    assert.ok(item.skill, 'item must have skill');
    assert.ok(item.grade, 'item must have grade');
  });

  // Verify explorer bank specs generation
  const explorerItems = ex.bankSpecs();
  assert.ok(explorerItems.length > 0, 'explorer specs must exist');
  explorerItems.forEach((spec) => {
    assert.ok(spec.prompt);
    assert.notEqual(spec.answer, undefined);
  });
});

test('core exercise logic: answer checking and normalization', () => {
  // Plain numbers & string conversions
  assert.equal(adaptive.isCorrect('5', 5), true);
  assert.equal(adaptive.isCorrect(' 5 ', 5), true);
  assert.equal(adaptive.isCorrect('6', 5), false);

  // Decimal separator (Hebrew comma and leading dot)
  assert.equal(adaptive.isCorrect('1,25', 1.25), true);
  assert.equal(adaptive.isCorrect('.75', 0.75), true);

  // Hebrew dashes in text answers (e.g. even/odd)
  ['-', '\u05BE', '\u2013', '\u2011'].forEach((dash) => {
    assert.equal(adaptive.isCorrect('אי' + dash + 'זוגי', 'אי-זוגי'), true);
  });

  // Explorer answer checking
  const [sing, groups, even] = ex.bankSpecs();
  assert.equal(ex.checkAnswer(sing, sing.answer), true);
  assert.equal(ex.checkAnswer(groups, groups.answer), true);
  assert.equal(ex.checkAnswer(even, even.answer), true);
  assert.equal(ex.checkAnswer(even, 'wrong'), false);
});

test('core exercise logic: state machine transitions for second try after wrong answer', () => {
  // Encouraging feedback state machine
  const item = { id: 'test-1', skill: 'addition', prompt: '3 + 2 = ?', answer: 5 };
  const s0 = fb.createFeedbackState(item);
  assert.equal(s0.phase, 'ask');
  assert.equal(s0.attempts, 0);

  // Wrong answer on first try -> transitions to hint_replay with retry enabled
  const s1 = fb.submitAnswer(s0, 99, false);
  assert.equal(s1.phase, 'hint_replay');
  assert.equal(s1.attempts, 1);
  assert.equal(s1.canRetry, true);
  assert.equal(s1.hasBuzzer, false, 'no buzzer on first mistake');
  assert.equal(s1.hasRedX, false, 'no red X on first mistake');
  assert.equal(s1.scoreLoss, false, 'no score loss on first mistake');

  const s2 = fb.startRetry(s1);
  assert.equal(s2.phase, 'retry');
  assert.equal(s2.canRetry, false);

  // Explorer exercise feedback flow
  const exState0 = ex.createState(item);
  const exMiss = ex.submit(exState0, '99');
  assert.equal(exMiss.phase, 'hint_replay');
  assert.equal(exMiss.secondTry, true);
  assert.equal(exMiss.hasBuzzer, false);
  assert.equal(exMiss.hasRedX, false);

  const exRetry = ex.startRetry(exMiss);
  assert.equal(exRetry.phase, 'retry');
  assert.equal(exRetry.secondTry, false);
});

test('audio playback scheduling: sound count equals numbers in the exercise', () => {
  // 3 + 2 = 5 -> sound count = 5 (numbers in the exercise)
  const plan = NP.extractNumberPlan({ prompt: '3 + 2 = ?', grade: 'א' }, { bpm: 60 });
  assert.equal(plan.totalSounds, 5, '3 + 2 should yield 5 total sounds');
  assert.equal(plan.notes.length, 5, 'scheduled notes count should equal 5');

  // Subtraction 7 - 3: 7 items + 3 removed/played = 10 sounds total
  const subPlan = NP.extractNumberPlan({ prompt: '7 - 3 = ?', grade: 'א' }, { bpm: 60 });
  assert.equal(subPlan.totalSounds, 10);
  assert.equal(subPlan.notes.length, 10);

  // Take away ten: 8 - 3 -> 8 circles represent the numbers in the exercise
  const spec = takeAwayTen.takeAwayCircles(8, 3);
  assert.equal(spec.circles.length, 8, 'circle count equals 8');
});

test('audio playback scheduling: one circle per sound', () => {
  // NumberPlay circles/dots match sound count
  const plan = NP.extractNumberPlan({ prompt: '4 + 3 = ?', grade: 'א' });
  const html = NP.renderHtml(plan);
  const dotCount = (html.match(/class="np-dot/g) || []).length;
  assert.equal(dotCount, plan.totalSounds, 'DOM circle count matches scheduled sound count 1-to-1');

  // Percent mix circles match scheduled sound count
  const pmSpec = PM.specForItem({ prompt: '25%', music: 'percentBar' });
  const pmEvents = PM.soundsOf(pmSpec);
  const pmHtml = PM.circlesHtml(pmSpec);
  const pmCircleCount = (pmHtml.match(/snd-dot/g) || []).length;
  assert.equal(pmCircleCount, pmEvents.length, 'Percent mix circle count matches sound count');

  // TakeAwayTen circles count in DOM matches spec circles length
  const taSpec = takeAwayTen.takeAwayCircles(6, 2);
  const taHtml = takeAwayTen.circlesHtml(taSpec);
  const taCircleCount = (taHtml.match(/class="snd-circle /g) || []).length;
  assert.equal(taCircleCount, taSpec.circles.length, 'One circle per sound in TakeAwayTen');
});

test('audio playback scheduling: first sound scheduled ≤ 1.0 s', () => {
  // NumberPlay first note start time
  const plan = NP.extractNumberPlan({ prompt: '2 + 3 = ?', grade: 'א' }, { bpm: 60 });
  assert.ok(plan.notes[0].at <= 1.0, `first note scheduled at ${plan.notes[0].at}s (must be <= 1.0s)`);
  assert.equal(plan.notes[0].at, 0, 'first note starts at t = 0s');

  // TakeAwayTen first sound event
  const spec = takeAwayTen.takeAwayCircles(5, 2);
  const events = takeAwayTen.soundEvents(spec);
  assert.ok(events[0].at <= 1.0, `first sound event at ${events[0].at}s (must be <= 1.0s)`);
  assert.equal(events[0].at, 0);

  // Percent mix first sound event
  const pmSpec = PM.specForItem({ prompt: '50%', music: 'percentBar' });
  const pmEvents = PM.soundsOf(pmSpec);
  assert.ok(pmEvents[0].at <= 1.0, `first percent mix event at ${pmEvents[0].at}s (must be <= 1.0s)`);
  assert.equal(pmEvents[0].at, 0);
});
