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

test('windowMs returns 0 for invalid bpm input instead of using default BPM_DEFAULT', () => {
  assert.equal(metro.windowMs(NaN, 2), 0);
});

test('extreme BPM values clamp to BPM_MIN (40) and BPM_MAX (140) for clampBpm, msPerBeat, and windowMs', () => {
  assert.equal(metro.clampBpm(30), metro.BPM_MIN);
  assert.equal(metro.clampBpm(30), 40);
  assert.equal(metro.clampBpm(300), metro.BPM_MAX);
  assert.equal(metro.clampBpm(300), 140);

  // msPerBeat clamping: 60000 / 40 = 1500ms, 60000 / 140 ms
  assert.equal(metro.msPerBeat(30), 1500);
  assert.equal(metro.msPerBeat(30), 60000 / 40);
  assert.equal(metro.msPerBeat(300), 60000 / 140);

  // windowMs clamping with 30 and 300
  assert.equal(metro.windowMs(30, 1), 1500);
  assert.equal(metro.windowMs(30, 2), 3000);
  assert.equal(metro.windowMs(300, 1), 60000 / 140);
  assert.equal(metro.windowMs(300, 2), (60000 / 140) * 2);
});

test('dynamic tempo changes across sequential streaks (1 to 6) with accelerate=true', () => {
  let state = { streak: 0, bpm: 80 };

  // Streak 1
  state = metro.applyStreak(state.bpm, state.streak, true, true);
  assert.deepEqual(state, { streak: 1, bpm: 80 });
  assert.equal(metro.nextBpm(80, 1, true), 80);

  // Streak 2
  state = metro.applyStreak(state.bpm, state.streak, true, true);
  assert.deepEqual(state, { streak: 2, bpm: 80 });
  assert.equal(metro.nextBpm(80, 2, true), 80);

  // Streak 3 -> advances by STREAK_STEP (4) to 84
  state = metro.applyStreak(state.bpm, state.streak, true, true);
  assert.deepEqual(state, { streak: 3, bpm: 84 });
  assert.equal(metro.nextBpm(80, 3, true), 84);

  // Streak 4
  state = metro.applyStreak(state.bpm, state.streak, true, true);
  assert.deepEqual(state, { streak: 4, bpm: 84 });
  assert.equal(metro.nextBpm(84, 4, true), 84);

  // Streak 5
  state = metro.applyStreak(state.bpm, state.streak, true, true);
  assert.deepEqual(state, { streak: 5, bpm: 84 });
  assert.equal(metro.nextBpm(84, 5, true), 84);

  // Streak 6 -> advances by STREAK_STEP (4) to 88
  state = metro.applyStreak(state.bpm, state.streak, true, true);
  assert.deepEqual(state, { streak: 6, bpm: 88 });
  assert.equal(metro.nextBpm(84, 6, true), 88);
});

test('wrong answer immediately resets streak to 0 while preserving current BPM', () => {
  assert.deepEqual(metro.applyStreak(88, 6, false, true), { streak: 0, bpm: 88 });
  assert.deepEqual(metro.applyStreak(84, 3, false, true), { streak: 0, bpm: 84 });
  assert.deepEqual(metro.applyStreak(80, 1, false, false), { streak: 0, bpm: 80 });
  assert.deepEqual(metro.applyStreak(120, 5, false, true), { streak: 0, bpm: 120 });
});

test('accelerating at or near BPM_MAX respects ceiling (138 -> 140, 140 -> 140)', () => {
  assert.equal(metro.nextBpm(138, 3, true), 140);
  assert.equal(metro.nextBpm(140, 3, true), 140);
  assert.equal(metro.nextBpm(140, 6, true), 140);

  assert.deepEqual(metro.applyStreak(138, 2, true, true), { streak: 3, bpm: 140 });
  assert.deepEqual(metro.applyStreak(140, 2, true, true), { streak: 3, bpm: 140 });
  assert.deepEqual(metro.applyStreak(140, 5, true, true), { streak: 6, bpm: 140 });
});

test('streak progression when accelerate is false preserves BPM across streaks', () => {
  let state = { streak: 0, bpm: 80 };
  for (let s = 1; s <= 6; s++) {
    state = metro.applyStreak(state.bpm, state.streak, true, false);
    assert.deepEqual(state, { streak: s, bpm: 80 });
    assert.equal(metro.nextBpm(80, s, false), 80);
  }
});

test('backward clock skew (now < openedAt) keeps window open and clamps windowRatio to at most 1', () => {
  const t0 = 1000;
  const skewedNow = t0 - 100; // 900
  const expectedRemaining = metro.windowMs(80, 2) - (skewedNow - t0); // 1500 - (-100) = 1600

  assert.equal(metro.windowRemaining(t0, skewedNow, 80, 2), expectedRemaining);
  assert.equal(metro.windowRemaining(t0, skewedNow, 80, 2), 1600);
  assert.equal(metro.isWindowOpen(t0, skewedNow, 80, 2), true);
  assert.equal(metro.windowRatio(t0, skewedNow, 80, 2), 1);

  assert.equal(metro.windowRemaining(10000, 0, 80, 2), 11500);
  assert.equal(metro.isWindowOpen(10000, 0, 80, 2), true);
  assert.equal(metro.windowRatio(10000, 0, 80, 2), 1);
});

test('now far in the future past window expiration returns 0 remaining, false open, 0 ratio', () => {
  const t0 = 1000;
  const farFuture = 1_000_000;
  assert.equal(metro.windowRemaining(t0, farFuture, 80, 2), 0);
  assert.equal(metro.isWindowOpen(t0, farFuture, 80, 2), false);
  assert.equal(metro.windowRatio(t0, farFuture, 80, 2), 0);

  const justPastWindow = t0 + metro.windowMs(80, 2) + 1; // 2501
  assert.equal(metro.windowRemaining(t0, justPastWindow, 80, 2), 0);
  assert.equal(metro.isWindowOpen(t0, justPastWindow, 80, 2), false);
  assert.equal(metro.windowRatio(t0, justPastWindow, 80, 2), 0);
});

test('non-finite openedAt or now (NaN, Infinity, -Infinity) return 0 remaining, false open, 0 ratio', () => {
  const nonFiniteValues = [NaN, Infinity, -Infinity];

  for (const val of nonFiniteValues) {
    // openedAt is non-finite
    assert.equal(metro.windowRemaining(val, 1000, 80, 2), 0);
    assert.equal(metro.isWindowOpen(val, 1000, 80, 2), false);
    assert.equal(metro.windowRatio(val, 1000, 80, 2), 0);

    // now is non-finite
    assert.equal(metro.windowRemaining(1000, val, 80, 2), 0);
    assert.equal(metro.isWindowOpen(1000, val, 80, 2), false);
    assert.equal(metro.windowRatio(1000, val, 80, 2), 0);

    // both are non-finite
    assert.equal(metro.windowRemaining(val, val, 80, 2), 0);
    assert.equal(metro.isWindowOpen(val, val, 80, 2), false);
    assert.equal(metro.windowRatio(val, val, 80, 2), 0);
  }
});
