// MelodyMath — RhythmMaster, a polyrhythm challenge track (#591, owner
// comment 6376159285).
//
// Every voice strikes once every v pulses (v = 3 means "every 3 pulses";
// v = 3/2 is a non-whole ratio, "every pulse and a half"). The voices start
// together and meet again after lcmOfVoices(voices) pulses: lcm(3, 4) = 12,
// lcm(2, 3, 5) = 30, lcm(3/2, 2) = 6. In that cycle voice i plays L / v_i
// strokes, which gives the ratio tasks (3 and 4 -> 4:3 strokes) and the
// fraction tasks (2 strokes of a voice that plays 4 = 2/4 = 1/2 of the cycle).
//
// Practice is interleaved: the kinds lcm / ratio / fraction take turns, never
// the same kind twice in a row (Rohrer et al. 2014, Taylor & Rohrer 2009).
// Every task also asks the child to pick the reason for the answer from 3
// options. validatePosedProblem() checks a puzzle the child made up
// ("המציאו חידה", Rosli et al. 2014) and refuses one without a solution.
//
// Everything here is pure: no DOM, no clock, no Math.random. The voice sets
// come from a small seeded generator so the same step always gives the same
// task.
(function (root, factory) {
  const api = factory();
  if (root) {
    root.MM_RHYTHM_TRACK = api;
    root.MM_RHYTHM_MASTER = api;
  }
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAX_VOICE = 12;
  const MIN_VOICES = 2;
  const MAX_VOICES = 4;
  const KINDS = ['lcm', 'ratio', 'fraction'];
  const KIND_HE = { lcm: 'מתי נפגשים', ratio: 'יחס', fraction: 'שבר' };
  const VOICE_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳'];

  // ---- numbers ----------------------------------------------------------

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x;
  }

  function lcm(a, b) {
    return a / gcd(a, b) * b;
  }

  // A voice as a reduced fraction {n, d}: 4, '4', 1.5, '3/2', {n:3, d:2}.
  // Only whole and half pulses (d = 1 or 2) between 0 and 12 are voices.
  function parseVoice(v) {
    let n;
    let d;
    if (v && typeof v === 'object') {
      n = Number(v.n);
      d = Number(v.d);
    } else if (typeof v === 'string' && v.indexOf('/') !== -1) {
      const parts = v.split('/');
      if (parts.length !== 2) return null;
      n = Number(parts[0].trim());
      d = Number(parts[1].trim());
    } else {
      const x = Number(v);
      if (typeof v === 'string' && v.trim() === '') return null;
      if (!Number.isFinite(x)) return null;
      if (Number.isInteger(x)) { n = x; d = 1; } else if (Number.isInteger(x * 2)) { n = x * 2; d = 2; } else return null;
    }
    if (!Number.isInteger(n) || !Number.isInteger(d) || n <= 0 || d <= 0) return null;
    const g = gcd(n, d);
    n /= g;
    d /= g;
    if (d > 2 || n / d > MAX_VOICE) return null;
    return { n: n, d: d };
  }

  function voiceValue(f) { return f.n / f.d; }

  function voiceText(v) {
    const f = parseVoice(v);
    if (!f) return String(v);
    return f.d === 1 ? String(f.n) : f.n + '/' + f.d;
  }

  // Pulses until every voice strikes together again. lcm(a/b, c/d) =
  // lcm(a, c) / gcd(b, d) for reduced fractions. null on a bad voice list.
  function lcmOfVoices(voices) {
    if (!Array.isArray(voices) || voices.length < 1) return null;
    let num = 0;
    let den = 0;
    for (let i = 0; i < voices.length; i++) {
      const f = parseVoice(voices[i]);
      if (!f) return null;
      if (i === 0) { num = f.n; den = f.d; } else { num = lcm(num, f.n); den = gcd(den, f.d); }
    }
    return num / den;
  }

  // Strokes each voice plays in one cycle (L / v), e.g. [3, 4] -> [4, 3].
  function strokesPerCycle(voices) {
    const L = lcmOfVoices(voices);
    if (L == null) return null;
    return voices.map(function (v) { return Math.round(L / voiceValue(parseVoice(v))); });
  }

  function reduceRatio(parts) {
    const g = parts.reduce(function (a, b) { return gcd(a, b); });
    return parts.map(function (p) { return p / g; });
  }

  function fracText(n, d) {
    const g = gcd(n, d);
    return (n / g) + '/' + (d / g);
  }

  function parseFraction(s) {
    const m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(String(s));
    if (!m || Number(m[2]) === 0) return null;
    return Number(m[1]) / Number(m[2]);
  }

  function parseRatio(s) {
    const parts = String(s).split(':').map(function (p) { return p.trim(); });
    if (parts.length < 2 || parts.some(function (p) { return !/^\d+$/.test(p) || Number(p) === 0; })) return null;
    return reduceRatio(parts.map(Number)).join(':');
  }

  // Is `given` the same answer as `answer` for a task kind?
  function sameAnswer(kind, given, answer) {
    if (given == null || String(given).trim() === '') return false;
    if (kind === 'lcm') return Number(String(given).trim()) === Number(answer);
    if (kind === 'ratio') return parseRatio(given) != null && parseRatio(given) === parseRatio(answer);
    if (kind === 'fraction') {
      const a = parseFraction(given);
      return a != null && Math.abs(a - parseFraction(answer)) < 1e-9;
    }
    return false;
  }

  // ---- adaptive difficulty ----------------------------------------------

  // TODO-source: the owner marked adaptive difficulty as an addition with no
  // direct evidence in this field (comment 6376159285). The 70-85% band and
  // the ladder below are a design choice, not a sourced finding.
  // Every step up adds a voice or a non-whole (half-pulse) voice.
  const LEVELS = [
    { voices: 2, half: false, max: 8, he: 'שני קולות' },
    { voices: 2, half: true, max: 6, he: 'שני קולות, אחד בחצאי פעמה' },
    { voices: 3, half: false, max: 6, he: 'שלושה קולות' },
    { voices: 3, half: true, max: 6, he: 'שלושה קולות, אחד בחצאי פעמה' },
    { voices: 4, half: false, max: 6, he: 'ארבעה קולות' },
  ];
  const BAND = { low: 0.7, high: 0.85, target: 0.8 };
  const WINDOW = 10;
  const MIN_ANSWERS = 8;

  function initialAdapt(level) {
    const l = Math.max(0, Math.min(LEVELS.length - 1, Number(level) || 0));
    return { level: l, recent: [] };
  }

  function successRate(recent) {
    if (!recent || !recent.length) return null;
    return recent.filter(Boolean).length / recent.length;
  }

  // One answer in. Over the last WINDOW answers: above 85% -> one level up
  // (a voice or a non-whole ratio is added); below 70% (after at least
  // MIN_ANSWERS) -> one level down; inside the band -> stay. The window restarts on a move.
  // Returns { state, move: 'up'|'down'|null, added: 'voice'|'half'|null, rate }.
  function adaptStep(state, correct) {
    const s = state && Array.isArray(state.recent) ? state : initialAdapt(state && state.level);
    const recent = s.recent.concat([!!correct]).slice(-WINDOW);
    const rate = successRate(recent);
    let level = s.level;
    let move = null;
    // Up needs a full window (a lucky short run is not mastery); down only
    // MIN_ANSWERS, so a child who is stuck is not left there for long.
    if (recent.length >= WINDOW && rate > BAND.high && level < LEVELS.length - 1) { level += 1; move = 'up'; }
    else if (recent.length >= MIN_ANSWERS && rate < BAND.low && level > 0) { level -= 1; move = 'down'; }
    let added = null;
    if (move === 'up') {
      const a = LEVELS[s.level];
      const b = LEVELS[level];
      added = b.voices > a.voices ? 'voice' : (b.half && !a.half ? 'half' : null);
    }
    return { state: { level: level, recent: move ? [] : recent }, move: move, added: added, rate: rate };
  }

  return {
    MAX_VOICE: MAX_VOICE,
    MIN_VOICES: MIN_VOICES,
    MAX_VOICES: MAX_VOICES,
    KINDS: KINDS,
    KIND_HE: KIND_HE,
    VOICE_HE: VOICE_HE,
    LEVELS: LEVELS,
    BAND: BAND,
    WINDOW: WINDOW,
    MIN_ANSWERS: MIN_ANSWERS,
    gcd: gcd,
    lcm: lcm,
    parseVoice: parseVoice,
    voiceValue: voiceValue,
    voiceText: voiceText,
    lcmOfVoices: lcmOfVoices,
    strokesPerCycle: strokesPerCycle,
    reduceRatio: reduceRatio,
    fracText: fracText,
    parseFraction: parseFraction,
    parseRatio: parseRatio,
    sameAnswer: sameAnswer,
    initialAdapt: initialAdapt,
    successRate: successRate,
    adaptStep: adaptStep,
  };
});
