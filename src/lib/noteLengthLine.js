// MelodyMath — NoteLengthLine (#591, owner proposal 27.10 2/5): where does
// this note sit on the line? Fraction size on the number line through note
// length, grades ג׳–ו׳ (Siegler, Thompson & Schneider 2011; Fuchs et al. 2013).
//
// The way stays M3 fillBar: the bar IS the 0–1 segment of the line (0–2 and
// 0–3 for mixed numbers in ה׳–ו׳). A point x on the line is the same part of
// the bar, and the note that fills it lasts exactly value × BAR_SECONDS, never
// rounded. Size is heard only through length: every note has the same pitch.
// Pure logic, tested in Node; NoteLengthLineScreen wires it to the page.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_NOTE_LENGTH_LINE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const FB = root.MM_FRACTION_BAR || require('./music/fractionBar.js');
  const WAY = 'fillBar';
  const BAR_SECONDS = 2; // one 4/4 bar at 120 BPM
  const HZ = 392; // one fixed pitch (G4): magnitude is never pitch (M5 is weak evidence)
  const DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 100];
  const STORE_KEY = 'mm.noteLengthLine.magnitudeError';

  // place: one note on the line; compare: two notes in a row, both placed.
  const ITEMS = [
    { kind: 'place', max: 1, values: ['3/4'] },
    { kind: 'place', max: 1, values: ['1/2'] },
    { kind: 'place', max: 1, values: ['1/3'] },
    { kind: 'place', max: 1, values: ['2/5'] },
    { kind: 'place', max: 1, values: ['5/6'] },
    { kind: 'place', max: 1, values: ['3/8'] },
    { kind: 'place', max: 1, values: ['7/10'] },
    { kind: 'compare', max: 1, values: ['2/3', '3/5'] },
    { kind: 'compare', max: 1, values: ['3/8', '1/3'] },
    { kind: 'place', max: 2, values: ['3/2'], grade: 'ה' },
    { kind: 'place', max: 3, values: ['7/3'], grade: 'ה' },
    { kind: 'place', max: 1, values: ['0.45'], grade: 'ו' },
    { kind: 'compare', max: 1, values: ['0.75', '3/4'], grade: 'ו' },
  ];

  const NO_MUSIC_CHECK_ITEMS = [
    { id: 'nll-nm-1', prompt: 'מה גדול יותר: 2/3 או 3/5? כתבו את הגדול.', answer: '2/3' },
    { id: 'nll-nm-2', prompt: 'איזה שבר נמצא באמצע הקו בין 0 ל־1?', answer: '1/2' },
    { id: 'nll-nm-3', prompt: 'כתבו את 0.75 כשבר.', answer: '3/4' },
  ];

  function value(v) { const f = FB.toFraction(v); return f ? f.n / f.d : null; }

  // Position x (0..1 of the line's width) -> value on a 0..max line.
  function positionToValue(x, max) { return Math.min(1, Math.max(0, Number(x) || 0)) * (max || 1); }
  function valueToPosition(v, max) { return value(v) / (max || 1); }

  // Nearest fraction with denominator d at position x: '3/4' at x = 0.75, d = 4.
  function fractionAt(x, max, d) { return FB.formatFraction(FB.toFraction({ n: Math.round(positionToValue(x, max) * d), d: d })); }

  // Exact length in seconds: n × BAR_SECONDS / d, with no rounding step.
  function durationOf(v) {
    const f = typeof v === 'number' ? null : FB.toFraction(v);
    return f ? (f.n * BAR_SECONDS) / f.d : Number(v) * BAR_SECONDS;
  }

  // One held note per length, same pitch, a short rest between them.
  function playPlan(lengths, voice) {
    let at = 0;
    return lengths.map(function (v, i) {
      const n = { at: at, voice: voice || 'pluck', hz: HZ, held: true, dur: durationOf(v), gain: 0.2, index: i };
      at += n.dur + 0.4;
      return n;
    });
  }

  // Distance on the line as a share of its length (Siegler's PAE).
  function magnitudeError(chosen, target, max) { return Math.abs(Number(chosen) - value(target)) / (max || 1); }

  function feedback(chosen, target, max) {
    const err = magnitudeError(chosen, target, max);
    const dir = Number(chosen) < value(target) ? 'קצר מדי' : 'ארוך מדי';
    if (err <= 0.05) return { level: 'close', err: err, he: 'קרוב מאוד! כמעט בדיוק ' + target };
    if (err <= 0.15) return { level: 'near', err: err, he: 'קרוב, אבל ' + dir + '. הקשיבו שוב.' };
    return { level: 'far', err: err, he: 'רחוק: התו שלכם ' + dir + '. הקשיבו לאורך האמיתי.' };
  }

  // Compare items: the order on the line must match (equal values: within 0.05).
  function orderRight(chosen, values, max) {
    const a = value(values[0]), b = value(values[1]), d = (chosen[0] - chosen[1]) / (max || 1);
    if (a === b) return Math.abs(d) <= 0.05;
    return (a > b) === (d > 0);
  }

  function store(storage) {
    try { return storage || root.localStorage || null; } catch (e) { return null; }
  }
  function key(childId) { return STORE_KEY + (childId ? '.' + childId : ''); }

  // Running mean of magnitudeError per child, kept to see the line improve.
  function recordError(err, childId, storage) {
    const s = store(storage);
    const cur = meanError(childId, s, true);
    const next = { sum: cur.sum + err, n: cur.n + 1 };
    try { if (s) s.setItem(key(childId), JSON.stringify(next)); } catch (e) { /* private mode */ }
    return next.sum / next.n;
  }
  function meanError(childId, storage, raw) {
    let x = { sum: 0, n: 0 };
    try { const s = store(storage); const v = s && JSON.parse(s.getItem(key(childId)) || 'null'); if (v && v.n > 0) x = v; } catch (e) { /* bad data */ }
    return raw ? x : (x.n ? x.sum / x.n : null);
  }

  return {
    WAY: WAY, BAR_SECONDS: BAR_SECONDS, HZ: HZ, DENOMINATORS: DENOMINATORS, ITEMS: ITEMS, NO_MUSIC_CHECK_ITEMS: NO_MUSIC_CHECK_ITEMS,
    value: value, positionToValue: positionToValue, valueToPosition: valueToPosition, fractionAt: fractionAt, durationOf: durationOf,
    playPlan: playPlan, magnitudeError: magnitudeError, feedback: feedback, orderRight: orderRight, recordError: recordError, meanError: meanError,
  };
});
