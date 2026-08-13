// MelodyMath — optional click-track pacing. Not a treatment.
//
// A teacher can start a metronome on a shared tablet and, if she wants,
// let the tempo rise after a streak. That is a pacing control she operates.
// It is not evidence that rhythm improves math.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const BPM_MIN = 40;
  const BPM_MAX = 140;
  const BPM_DEFAULT = 80;
  const STREAK_EVERY = 3;
  const STREAK_STEP = 4;

  function clampBpm(n) {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) return BPM_DEFAULT;
    return Math.min(BPM_MAX, Math.max(BPM_MIN, v));
  }

  function msPerBeat(bpm) {
    return 60000 / clampBpm(bpm);
  }

  function nextBpm(current, streak, accelerate) {
    const bpm = clampBpm(current);
    if (!accelerate) return bpm;
    const s = Math.max(0, Math.round(Number(streak) || 0));
    if (s > 0 && s % STREAK_EVERY === 0) return clampBpm(bpm + STREAK_STEP);
    return bpm;
  }

  // Answer window follows the beat. Default: two beats to tap.
  // Wait-preference (accessibility) doubles that. Not a treatment.
  const BEATS_DEFAULT = 2;
  const BEATS_WAIT = 4;
  const BEATS_MIN = 1;
  const BEATS_MAX = 8;

  function clampBeats(n) {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) return BEATS_DEFAULT;
    return Math.min(BEATS_MAX, Math.max(BEATS_MIN, v));
  }

  function beatsForPrefs(prefs) {
    const p = prefs && typeof prefs === 'object' ? prefs : {};
    if (p.wait) return BEATS_WAIT;
    return clampBeats(p.beats != null ? p.beats : BEATS_DEFAULT);
  }

  function windowMs(bpm, beats) {
    return msPerBeat(bpm) * clampBeats(beats);
  }

  function windowRemaining(openedAt, now, bpm, beats) {
    const open = Number(openedAt);
    const t = Number(now);
    if (!Number.isFinite(open) || !Number.isFinite(t)) return 0;
    return Math.max(0, windowMs(bpm, beats) - (t - open));
  }

  function isWindowOpen(openedAt, now, bpm, beats) {
    return windowRemaining(openedAt, now, bpm, beats) > 0;
  }

  function windowRatio(openedAt, now, bpm, beats) {
    const total = windowMs(bpm, beats);
    if (total <= 0) return 0;
    return Math.max(0, Math.min(1, windowRemaining(openedAt, now, bpm, beats) / total));
  }

  function applyStreak(bpm, streak, correct, accelerate) {
    const nextStreak = correct ? Math.max(0, Math.round(Number(streak) || 0)) + 1 : 0;
    return {
      streak: nextStreak,
      bpm: nextBpm(bpm, nextStreak, !!accelerate),
    };
  }

  return {
    BPM_MIN: BPM_MIN,
    BPM_MAX: BPM_MAX,
    BPM_DEFAULT: BPM_DEFAULT,
    STREAK_EVERY: STREAK_EVERY,
    STREAK_STEP: STREAK_STEP,
    BEATS_DEFAULT: BEATS_DEFAULT,
    BEATS_WAIT: BEATS_WAIT,
    clampBpm: clampBpm,
    msPerBeat: msPerBeat,
    nextBpm: nextBpm,
    clampBeats: clampBeats,
    beatsForPrefs: beatsForPrefs,
    windowMs: windowMs,
    windowRemaining: windowRemaining,
    isWindowOpen: isWindowOpen,
    windowRatio: windowRatio,
    applyStreak: applyStreak,
  };
});
