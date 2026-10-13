// MelodyMath — when two drums meet, which meters a bar of beats splits into,
// and how long one beat lasts (plan §5, grade ה׳, #106).
//
// Two drums playing 3 and 2 evenly in the same span start together again
// after lcm(3, 2) = 6 pulses. A bar of n beats splits into equal groups of
// every factor of n; a prime n only splits into 1 group or n groups.
// secondsPerBeat() is 60/BPM as a decimal the child can type and check with
// adaptive.isDecimalAnswer.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAX_BEATS = 1000;

  function wholeBeats(n) {
    const v = Number(n);
    return Number.isInteger(v) && v >= 1 && v <= MAX_BEATS ? v : null;
  }

  function gcdOf(a, b) {
    let x = a;
    let y = b;
    while (y) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x;
  }

  // Least common multiple of two or more beat counts; null on bad input.
  function lcmOf() {
    const args = Array.prototype.slice.call(arguments);
    if (!args.length) return null;
    let out = 1;
    for (let i = 0; i < args.length; i++) {
      const n = wholeBeats(args[i]);
      if (n == null) return null;
      out = out / gcdOf(out, n) * n;
    }
    return out;
  }

  // Pulse indexes (0-based) where both drums strike, within `span` pulses.
  function meetingPulses(a, b, span) {
    const step = lcmOf(a, b);
    const len = wholeBeats(span);
    if (step == null || len == null) return [];
    const out = [];
    for (let p = 0; p < len; p += step) out.push(p);
    return out;
  }

  // Every equal grouping of a bar: the factors of n, smallest first.
  function factorsOf(n) {
    const v = wholeBeats(n);
    if (v == null) return [];
    const out = [];
    for (let d = 1; d <= v; d++) if (v % d === 0) out.push(d);
    return out;
  }

  // Meters a bar of n beats can be counted in: groups of 2 or more beats,
  // excluding the whole bar as one group.
  function metersOf(n) {
    return factorsOf(n).filter(function (d) { return d > 1 && d < n; });
  }

  function isPrimeBeats(n) {
    return factorsOf(n).length === 2;
  }

  // 60/BPM rounded to 3 decimals: 120 → 0.5, 80 → 0.75, 90 → 0.667.
  function secondsPerBeat(bpm) {
    const v = Number(bpm);
    if (!Number.isFinite(v) || v <= 0) return null;
    return Math.round(60 / v * 1000) / 1000;
  }

  return { lcmOf, meetingPulses, factorsOf, metersOf, isPrimeBeats, secondsPerBeat };
});
