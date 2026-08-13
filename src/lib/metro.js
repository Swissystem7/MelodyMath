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

  return {
    BPM_MIN: BPM_MIN,
    BPM_MAX: BPM_MAX,
    BPM_DEFAULT: BPM_DEFAULT,
    STREAK_EVERY: STREAK_EVERY,
    STREAK_STEP: STREAK_STEP,
    clampBpm: clampBpm,
    msPerBeat: msPerBeat,
    nextBpm: nextBpm,
  };
});
