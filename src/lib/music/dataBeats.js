// MelodyMath — DataBeats logic: a bar graph you hear in time (#591, owner
// comment 6376162984, "DataBeats ו-PercentMix").
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_DATA_BEATS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MECHANISM = 'M1';
  const ACCENT_MECHANISM = 'M2';
  const PITCH_MECHANISM = 'M5';
  const MAX_TAPS = 12;
  const DEFAULT_BPM = 100;
  const TAP_VOICE = 'woodClick';
  const PITCH_VOICE = 'woodBar';
  const PITCH_LOW = 60; // MIDI C4
  const PITCH_HIGH = 72; // MIDI C5
  const MIN_NOTE_SEC = 0.08;
  const MIN_NOTE_MS = 80;
  const SOURCES = Object.freeze({ M1: 'mcdonel2015', M2: 'das2023' });

  function checkSeries(values) {
    if (!Array.isArray(values) || values.length === 0) throw new RangeError('a series needs at least one column');
    values.forEach(function (v) {
      if (!Number.isInteger(v) || v < 0 || v > MAX_TAPS) throw new RangeError('a column is a whole number of taps from 0 to ' + MAX_TAPS + ', got ' + v);
    });
  }

  function midiToHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function sonifySeries(values, opts) {
    checkSeries(values);
    const o = opts || {};
    const bpm = o.bpm > 0 ? o.bpm : DEFAULT_BPM;
    const tap = 60 / bpm / 2; // two taps per beat
    const tallest = Math.max.apply(null, values);
    const slot = Math.max(1, tallest) * tap;
    const gap = 2 * tap;
    const lo = Math.min.apply(null, values);
    const dur = Math.max(MIN_NOTE_SEC, Math.round(tap * 1000) / 1000);
    const durMs = Math.max(MIN_NOTE_MS, Math.round(dur * 1000));
    const bars = [];
    const notes = [];
    let t = 0;
    values.forEach(function (v, bar) {
      bars.push({ bar: bar, value: v, start: t, end: t + v * tap });
      let hz;
      if (o.pitch) {
        const span = tallest - lo;
        const m = span === 0 ? (PITCH_LOW + PITCH_HIGH) / 2 : PITCH_LOW + ((v - lo) / span) * (PITCH_HIGH - PITCH_LOW);
        hz = Math.round(midiToHz(m) * 100) / 100;
      }
      for (let n = 0; n < v; n++) {
        const accent = (n + 1) % 5 === 0;
        const note = {
          at: Math.round((t + n * tap) * 1000) / 1000,
          dur: dur,
          durMs: durMs,
          voice: o.pitch ? (o.pitchVoice || PITCH_VOICE) : (o.voice || TAP_VOICE),
          kind: 'tap',
          bar: bar,
          n: n + 1,
          accent: accent
        };
        if (o.pitch) note.hz = hz;
        notes.push(note);
      }
      t += slot + gap;
    });
    return {
      mapping: 'time',
      mechanism: MECHANISM,
      accentMechanism: ACCENT_MECHANISM,
      sources: SOURCES,
      bars: bars,
      notes: notes,
      duration: Math.round((t - gap) * 1000) / 1000,
      tap: tap,
      pitch: o.pitch ? { mechanism: PITCH_MECHANISM, optional: true, evidence: 'weak' } : null,
    };
  }

  function mean(values) {
    checkSeries(values);
    return values.reduce(function (s, v) { return s + v; }, 0) / values.length;
  }

  function range(values) {
    checkSeries(values);
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    return { min: min, max: max, range: max - min };
  }

  function trend(values) {
    checkSeries(values);
    const n = values.length;
    if (n < 2) return 'flat';
    const mx = (n - 1) / 2;
    const my = mean(values);
    let num = 0;
    let den = 0;
    values.forEach(function (v, i) { num += (i - mx) * (v - my); den += (i - mx) * (i - mx); });
    const slope = num / den;
    if (Math.abs(slope) < 0.25) return 'flat';
    return slope > 0 ? 'up' : 'down';
  }

  const TREND_HE = { up: 'עולה', down: 'יורדת', flat: 'כמעט קבועה' };

  const SERIES = [
    { values: [2, 4, 6, 8], he: 'כמה דקות קראו ילדי הכיתה בכל יום' },
    { values: [9, 7, 5, 3], he: 'כמה עלים נשארו על השתיל בכל שבוע' },
    { values: [6, 3, 7, 4], he: 'כמה ציפורים ראינו בחצר בכל בוקר', zigzag: true },
    { values: [5, 5, 6, 4], he: 'כמה גולים נכנסו בכל משחקון' },
    { values: [1, 3, 5, 7, 9], he: 'כמה צעדים קפצה הצפרדע בכל סיבוב' },
    { values: [10, 8, 8, 6], he: 'כמה עוגיות נשארו בצנצנת בכל ערב' },
  ];

  function uniqueChoices(answer, candidates, max) {
    const out = [answer];
    candidates.forEach(function (c) {
      if (out.length < max && out.indexOf(c) === -1 && c >= 0) out.push(c);
    });
    return out.sort(function (a, b) { return a - b; });
  }

  function meanQuestion(values) {
    const m = mean(values);
    const r = range(values);
    return { kind: 'mean', answer: m, choices: uniqueChoices(m, [m + 1, m - 1, r.max, r.min, m + 2], 4), he: 'מה הממוצע? כמה הקשות היו בכל עמודה אם היינו משווים את כולן?' };
  }
  function rangeQuestion(values) {
    const r = range(values);
    return { kind: 'range', answer: r.range, choices: uniqueChoices(r.range, [r.max, r.range + 1, r.range - 1, r.min], 4), he: 'מה הטווח? בכמה הקשות העמודה הארוכה ארוכה מהקצרה?' };
  }
  function trendQuestion(values) {
    return { kind: 'trend', answer: trend(values), choices: ['up', 'down', 'flat'], he: 'לאן הולכת המגמה?' };
  }

  return {
    MECHANISM: MECHANISM,
    ACCENT_MECHANISM: ACCENT_MECHANISM,
    PITCH_MECHANISM: PITCH_MECHANISM,
    MAX_TAPS: MAX_TAPS,
    TAP_VOICE: TAP_VOICE,
    MIN_NOTE_SEC: MIN_NOTE_SEC,
    MIN_NOTE_MS: MIN_NOTE_MS,
    SOURCES: SOURCES,
    SERIES: SERIES,
    TREND_HE: TREND_HE,
    sonifySeries: sonifySeries,
    mean: mean,
    range: range,
    trend: trend,
    meanQuestion: meanQuestion,
    rangeQuestion: rangeQuestion,
    trendQuestion: trendQuestion,
  };
});
