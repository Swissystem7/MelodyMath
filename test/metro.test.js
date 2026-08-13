const test = require('node:test');
const assert = require('node:assert/strict');
const metro = require('../src/lib/metro');

test('BPM stays inside 40–140 and defaults when garbage arrives', () => {
  assert.equal(metro.clampBpm(80), 80);
  assert.equal(metro.clampBpm(10), 40);
  assert.equal(metro.clampBpm(400), 140);
  assert.equal(metro.clampBpm('nope'), 80);
});

test('a streak of three raises BPM only when the teacher asked for acceleration', () => {
  assert.equal(metro.nextBpm(80, 3, false), 80);
  assert.equal(metro.nextBpm(80, 2, true), 80);
  assert.equal(metro.nextBpm(80, 3, true), 84);
  assert.equal(metro.nextBpm(80, 6, true), 84);
  assert.equal(metro.nextBpm(138, 3, true), 140);
});

test('ms per beat is 750 at 80 BPM', () => {
  assert.equal(metro.msPerBeat(80), 750);
});

test('the answer window is two beats, or four when the teacher asked to wait', () => {
  assert.equal(metro.windowMs(80, 2), 1500);
  assert.equal(metro.beatsForPrefs({}), 2);
  assert.equal(metro.beatsForPrefs({ wait: true }), 4);
  assert.equal(metro.windowMs(80, metro.beatsForPrefs({ wait: true })), 3000);
  assert.equal(metro.clampBeats(99), 8);
  assert.equal(metro.clampBeats('nope'), 2);
});

test('a window opened now is open, and is closed after its beats elapse', () => {
  const t0 = 1_000_000;
  assert.equal(metro.isWindowOpen(t0, t0 + 200, 80, 2), true);
  assert.equal(metro.isWindowOpen(t0, t0 + 1500, 80, 2), false);
  assert.equal(metro.windowRemaining(t0, t0 + 750, 80, 2), 750);
  assert.ok(metro.windowRatio(t0, t0, 80, 2) > 0.99);
  assert.equal(metro.windowRatio(t0, t0 + 2000, 80, 2), 0);
});

test('applyStreak raises BPM on a multiple of three only when acceleration is on', () => {
  assert.deepEqual(metro.applyStreak(80, 2, true, true), { streak: 3, bpm: 84 });
  assert.deepEqual(metro.applyStreak(80, 2, true, false), { streak: 3, bpm: 80 });
  assert.deepEqual(metro.applyStreak(84, 5, false, true), { streak: 0, bpm: 84 });
});
