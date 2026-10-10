const test = require('node:test');
const assert = require('node:assert/strict');
const rhythm = require('../src/lib/rhythmGame');

test('rhythm stages progress through drums, bass, chords, and full melody', () => {
  assert.equal(rhythm.stageForStreak(0).level, 1);
  assert.equal(rhythm.stageForStreak(2).level, 1);
  assert.equal(rhythm.stageForStreak(3).level, 2);
  assert.equal(rhythm.stageForStreak(5).level, 2);
  assert.equal(rhythm.stageForStreak(6).level, 3);
  assert.equal(rhythm.stageForStreak(9).level, 3);
  assert.equal(rhythm.stageForStreak(10).level, 4);
  assert.equal(rhythm.stageForStreak(25).level, 4);
});

test('evaluateTap rates hits accurately based on timing tolerance', () => {
  const perfect = rhythm.evaluateTap(1000, 1020, 150);
  assert.equal(perfect.hit, true);
  assert.equal(perfect.rating, 'perfect');

  const good = rhythm.evaluateTap(1000, 1120, 150);
  assert.equal(good.hit, true);
  assert.equal(good.rating, 'good');

  const miss = rhythm.evaluateTap(1000, 1250, 150);
  assert.equal(miss.hit, false);
  assert.equal(miss.rating, 'miss');
});

test('bpm scales up gradually with streak up to 140 max', () => {
  assert.equal(rhythm.bpmForStreak(80, 0), 80);
  assert.equal(rhythm.bpmForStreak(80, 4), 84);
  assert.equal(rhythm.bpmForStreak(80, 8), 88);
  assert.equal(rhythm.bpmForStreak(80, 100), 140);
});

test('all rhythm patterns strictly sum to a full 4/4 whole note', () => {
  rhythm.PATTERNS.forEach((p) => {
    const sum = p.durations.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001, `${p.id} duration sum is ${sum}`);
    assert.equal(p.durations.length, p.fractions.length);
  });
});
