// MelodyMath — DataBeats: a bar graph in time, accent every 5 taps (McDonel 2015, Das 2023). Refs #682 #665.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_DATA_BEATS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MECHANISM = 'M1', ACCENT_MECHANISM = 'M2', PITCH_MECHANISM = 'M5', MAX_TAPS = 12, DEFAULT_BPM = 100;
  const TAP_VOICE = 'woodClick', ACCENT_VOICE = 'woodBar', PITCH_LOW = 60, PITCH_HIGH = 72;
  const MIN_NOTE_SEC = 0.08, MIN_NOTE_MS = 80, SOURCES = Object.freeze({ M1: 'mcdonel2015', M2: 'das2023' });

  function checkSeries(values) {
    if (!Array.isArray(values) || !values.length) throw new RangeError('a series needs at least one column');
    values.forEach(function (v) {
      if (!Number.isInteger(v) || v < 0 || v > MAX_TAPS) throw new RangeError('a column is 0 to ' + MAX_TAPS + ', got ' + v);
    });
  }

  function sonifySeries(values, opts) {
    checkSeries(values);
    const o = opts || {}, tap = 60 / (o.bpm > 0 ? o.bpm : DEFAULT_BPM) / 2;
    const hi = Math.max.apply(null, values), lo = Math.min.apply(null, values), gap = 2 * tap;
    const dur = Math.max(MIN_NOTE_SEC, Math.round(tap * 1000) / 1000), durMs = Math.max(MIN_NOTE_MS, Math.round(dur * 1000));
    const bars = [], notes = [];
    let t = 0;
    values.forEach(function (v, bar) {
      bars.push({ bar: bar, value: v, start: t, end: t + v * tap });
      const midi = hi === lo ? (PITCH_LOW + PITCH_HIGH) / 2 : PITCH_LOW + ((v - lo) / (hi - lo)) * (PITCH_HIGH - PITCH_LOW);
      for (let n = 0; n < v; n++) {
        const accent = (n + 1) % 5 === 0;
        const note = { at: Math.round((t + n * tap) * 1000) / 1000, dur: dur, durMs: durMs, kind: accent ? 'accent' : 'tap', accent: accent,
          voice: accent ? (o.accentVoice || ACCENT_VOICE) : (o.voice || TAP_VOICE), bar: bar, n: n + 1 };
        if (o.pitch) note.hz = Math.round(440 * Math.pow(2, (midi - 69) / 12) * 100) / 100;
        notes.push(note);
      }
      t += Math.max(1, hi) * tap + gap;
    });
    return { mapping: 'time', mechanism: MECHANISM, accentMechanism: ACCENT_MECHANISM, sources: SOURCES, bars: bars, notes: notes,
      duration: Math.round((t - gap) * 1000) / 1000, tap: tap, pitch: o.pitch ? { mechanism: PITCH_MECHANISM, optional: true, evidence: 'weak' } : null };
  }

  function mean(v) { checkSeries(v); return v.reduce(function (s, x) { return s + x; }, 0) / v.length; }
  function range(v) { checkSeries(v); const min = Math.min.apply(null, v), max = Math.max.apply(null, v); return { min: min, max: max, range: max - min }; }
  function trend(v) {
    checkSeries(v); if (v.length < 2) return 'flat';
    const mx = (v.length - 1) / 2, my = mean(v);
    let num = 0, den = 0;
    v.forEach(function (x, i) { num += (i - mx) * (x - my); den += (i - mx) * (i - mx); });
    const s = num / den; return Math.abs(s) < 0.25 ? 'flat' : (s > 0 ? 'up' : 'down');
  }

  return { MECHANISM: MECHANISM, ACCENT_MECHANISM: ACCENT_MECHANISM, PITCH_MECHANISM: PITCH_MECHANISM, MAX_TAPS: MAX_TAPS, SOURCES: SOURCES,
    TAP_VOICE: TAP_VOICE, MIN_NOTE_SEC: MIN_NOTE_SEC, MIN_NOTE_MS: MIN_NOTE_MS, sonifySeries: sonifySeries, mean: mean, range: range, trend: trend };
});
