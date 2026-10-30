// MelodyMath — FractionBarPad logic: filling a 4/4 bar with note durations
// (#591, owner feature proposal 1/5, mechanism M3 only).
//
// Pure logic, no sound and no DOM: the touch layer plays the tiles. Every
// duration is an exact fraction {n, d} of the whole bar, never a float, so
// 1/2 + 1/4 + 1/4 is exactly one bar and 1/3 + 1/3 + 1/3 is too.
//
// checkFill() tells the child what is over or missing ("עברת ב־1/8",
// "חסר 1/4"); addTile() refuses a tile that would overflow the bar, so the
// child can try again at once. barFractionToDecimal / decimalToBarFraction
// read 0.25 as a quarter of the bar and back.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_FRACTION_BAR = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MECHANISM = 'M3';
  const MAX_DEN = 64;

  // The note tiles of the pad: whole, half, quarter, eighth, sixteenth.
  const DURATIONS = [
    { id: 'whole', he: 'שלמה', n: 1, d: 1 },
    { id: 'half', he: 'חצי', n: 1, d: 2 },
    { id: 'quarter', he: 'רבע', n: 1, d: 4 },
    { id: 'eighth', he: 'שמינית', n: 1, d: 8 },
    { id: 'sixteenth', he: 'שש־עשרה', n: 1, d: 16 },
  ];
  const BY_ID = {};
  DURATIONS.forEach(function (x) { BY_ID[x.id] = x; });

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) { const t = y; y = x % y; x = t; }
    return x || 1;
  }

  function frac(n, d) {
    if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) return null;
    const s = d < 0 ? -1 : 1;
    const g = gcd(n, d);
    return { n: (s * n) / g, d: (s * d) / g };
  }

  // A number becomes the exact fraction with the smallest denominator up to
  // MAX_DEN (0.25 -> 1/4, 1/3 -> 1/3); anything else is not a bar duration.
  function fromNumber(x) {
    if (!Number.isFinite(x)) return null;
    for (let d = 1; d <= MAX_DEN; d++) {
      const n = Math.round(x * d);
      if (Math.abs(n / d - x) < 1e-9) return frac(n, d);
    }
    return null;
  }

  const GLYPHS = { '½': [1, 2], '¼': [1, 4], '¾': [3, 4], '⅛': [1, 8] };

  // Accepts {n, d}, a duration id ('quarter'), '1/4', '¼', '0.25', 0.25, or mixed number '1 1/2' / '1 ו־1/2'.
  function toFraction(v) {
    if (v && typeof v === 'object' && 'n' in v && 'd' in v) return frac(Number(v.n), Number(v.d));
    if (typeof v === 'number') return fromNumber(v);
    const raw = String(v == null ? '' : v).trim();
    // Mixed number with space or Hebrew ו: "1 1/2", "1 ו־1/2", "1 ו-1/2"
    const mixed = /^(\d+)(?:\s+|\s*ו[־\-]?\s*)(\d+)\/(\d+)$/.exec(raw);
    if (mixed) {
      const whole = Number(mixed[1]);
      const num = Number(mixed[2]);
      const den = Number(mixed[3]);
      if (den === 0) return null;
      return frac(whole * den + num, den);
    }
    const s = raw.replace(/\s/g, '');
    if (BY_ID[s]) return frac(BY_ID[s].n, BY_ID[s].d);
    if (GLYPHS[s]) return frac(GLYPHS[s][0], GLYPHS[s][1]);
    const m = /^(-?\d+)\/(\d+)$/.exec(s);
    if (m) return frac(Number(m[1]), Number(m[2]));
    if (/^-?\d+(\.\d+)?$/.test(s)) return fromNumber(Number(s));
    return null;
  }

  // Convert improper fraction or decimal to mixed number representation (Refs #665)
  // e.g. '3/2' -> '1 1/2' (or '1 ו־1/2' when hebrew: true)
  function toMixed(v, options) {
    const f = toFraction(v);
    if (!f || f.n < 0) return null;
    const opts = options || {};
    const useHebrew = Boolean(opts.hebrew);
    if (f.d === 1) return String(f.n);
    if (f.n < f.d) return f.n + '/' + f.d;
    const whole = Math.floor(f.n / f.d);
    const rem = f.n % f.d;
    if (rem === 0) return String(whole);
    if (useHebrew) return whole + ' ו־' + rem + '/' + f.d;
    return whole + ' ' + rem + '/' + f.d;
  }

  // Convert mixed number string back to improper fraction format (e.g. '1 1/2' -> '3/2')
  function fromMixed(s) {
    const f = toFraction(s);
    return format(f);
  }

  function add(a, b) { return frac(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return frac(a.n * b.d - b.n * a.d, a.d * b.d); }
  function cmp(a, b) { return a.n * b.d - b.n * a.d; }

  function format(f) {
    if (!f) return null;
    return f.d === 1 ? String(f.n) : f.n + '/' + f.d;
  }

  // Exact sum as a fraction; null when any duration is unreadable.
  function sumFraction(list) {
    let total = frac(0, 1);
    for (let i = 0; i < (list || []).length; i++) {
      const f = toFraction(list[i]);
      if (!f || f.n < 0) return null;
      total = add(total, f);
    }
    return total;
  }

  // Sum of durations in bars, computed on exact fractions:
  // sumDurations([1/2, 1/4, 1/4]) === 1.
  function sumDurations(list) {
    const f = sumFraction(list);
    return f ? f.n / f.d : null;
  }

  // Compare a fill with the target (default one whole 4/4 bar).
  // status 'exact' | 'over' | 'under' | 'invalid'; diff is the exact excess
  // or missing part; he is the feedback line shown with the gentle sound.
  function checkFill(list, target) {
    const sum = sumFraction(list);
    const goal = toFraction(target == null ? 1 : target);
    if (!sum || !goal || goal.n <= 0) return { status: 'invalid', sum: null, diff: null, he: null };
    const c = cmp(sum, goal);
    if (c === 0) return { status: 'exact', sum: format(sum), diff: '0', he: 'התיבה מלאה בדיוק' };
    if (c > 0) {
      const over = format(sub(sum, goal));
      return { status: 'over', sum: format(sum), diff: over, he: 'עברת ב־' + over };
    }
    const missing = format(sub(goal, sum));
    return { status: 'under', sum: format(sum), diff: missing, he: 'חסר ' + missing };
  }

  // Try to drop one tile into the bar. An overflowing tile is rejected and
  // the fill stays as it was; the result says by how much it would overflow.
  function addTile(fill, tile, target) {
    const current = (fill || []).slice();
    const f = toFraction(tile);
    if (!f || f.n <= 0) return { accepted: false, fill: current, check: checkFill(current, target), over: null };
    const next = current.concat([format(f)]);
    const check = checkFill(next, target);
    if (check.status === 'over') return { accepted: false, fill: current, check: checkFill(current, target), over: check.diff };
    return { accepted: true, fill: next, check: check, over: null };
  }

  const MAX_BARS = 4; // Upper bound: up to 4 bars can be heard/seen in Grade ד (Refs #665)

  // 0.25 -> '1/4'; 1.5 -> '3/2'. Spans up to 4 bars (≤ 4, Grade ד mm-cur-33/mm-cur-44).
  // Power-of-two denominators up to 1/16; values > 4 or non-note lengths return null.
  function decimalToBarFraction(x, options) {
    const num = typeof x === 'string' ? Number(x) : x;
    if (typeof num === 'number' && (num > MAX_BARS || num < 0)) return null;
    const f = toFraction(x);
    if (!f || f.n < 0 || 16 % f.d !== 0) return null;
    if (f.n / f.d > MAX_BARS) return null;
    const opts = options || {};
    if (opts.mixed) {
      return toMixed(f, opts);
    }
    return format(f);
  }

  // End-of-topic no-music check items for Grade ד mm-cur-33 (mixed numbers & improper fractions)
  const NO_MUSIC_CHECK_ITEMS = [
    {
      id: 'mm-cur-33-nm-1',
      topic: 'mm-cur-33',
      grade: 'ד',
      prompt: 'כתבו את 3/2 כמספר מעורב (למשל: 1 1/2 או 1 ו־1/2)',
      answer: '1 1/2',
      altAnswers: ['1 ו־1/2', '1 ו-1/2', '1 1/2'],
      noMusic: true,
      plain: true
    },
    {
      id: 'mm-cur-33-nm-2',
      topic: 'mm-cur-33',
      grade: 'ד',
      prompt: 'כתבו את 1 ו־1/4 כשבר מדומה (למשל: 5/4)',
      answer: '5/4',
      noMusic: true,
      plain: true
    }
  ];

  // '3/8' -> 0.375; the decimal the same part of the bar is written as.
  function barFractionToDecimal(v) {
    const f = toFraction(v);
    if (!f || f.n < 0) return null;
    return f.n / f.d;
  }

  return {
    MECHANISM: MECHANISM,
    DURATIONS: DURATIONS,
    MAX_BARS: MAX_BARS,
    toFraction: toFraction,
    formatFraction: format,
    toMixed: toMixed,
    fromMixed: fromMixed,
    sumFraction: sumFraction,
    sumDurations: sumDurations,
    checkFill: checkFill,
    addTile: addTile,
    decimalToBarFraction: decimalToBarFraction,
    barFractionToDecimal: barFractionToDecimal,
    NO_MUSIC_CHECK_ITEMS: NO_MUSIC_CHECK_ITEMS,
  };
});
