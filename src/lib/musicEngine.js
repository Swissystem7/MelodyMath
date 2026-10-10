// MelodyMath — the shared music engine (plan §3).
//
// Pure music arithmetic first: note lengths as exact fractions, bar filling,
// interval ratios, the harmonic series, the monochord and tempo. Fractions are
// {n, d} pairs in lowest terms and are never turned into floats, so
// 1/4 + 1/8 + 1/8 + 1/2 is exactly one bar and not 0.9999999.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // ---------- exact fractions ----------
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = a % b; a = b; b = t; }
    return a;
  }

  function makeFraction(n, d) {
    if (d == null) d = 1;
    if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) return null;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  }

  // Accepts {n, d}, [n, d], '3/8', an integer, or a note name / note object.
  function toFraction(x) {
    if (x == null) return null;
    if (Array.isArray(x)) return makeFraction(x[0], x[1]);
    if (typeof x === 'number') return Number.isInteger(x) ? makeFraction(x, 1) : null;
    if (typeof x === 'string') {
      const m = x.trim().match(/^(-?\d+)\s*\/\s*(\d+)$/);
      if (m) return makeFraction(Number(m[1]), Number(m[2]));
      if (/^-?\d+$/.test(x.trim())) return makeFraction(Number(x), 1);
      return durationToFraction(x);
    }
    if (typeof x === 'object') {
      if ('n' in x && 'd' in x) return makeFraction(x.n, x.d);
      return durationToFraction(x);
    }
    return null;
  }

  function addFractions(a, b) {
    const x = toFraction(a), y = toFraction(b);
    if (!x || !y) return null;
    return makeFraction(x.n * y.d + y.n * x.d, x.d * y.d);
  }

  function compareFractions(a, b) {
    const x = toFraction(a), y = toFraction(b);
    if (!x || !y) return NaN;
    return Math.sign(x.n * y.d - y.n * x.d);
  }

  function fractionText(f) {
    const x = toFraction(f);
    if (!x) return '';
    return x.d === 1 ? String(x.n) : x.n + '/' + x.d;
  }

  // ---------- note lengths ----------
  const NOTE_VALUES = { whole: 1, half: 2, quarter: 4, eighth: 8, sixteenth: 16 };
  const NOTE_ORDER = ['whole', 'half', 'quarter', 'eighth', 'sixteenth'];

  // 'quarter', 'dotted quarter', 'quarter triplet', or {name, dotted, triplet}.
  function durationToFraction(note, mods) {
    let name = note, dotted = false, triplet = false;
    if (note && typeof note === 'object') {
      name = note.name; dotted = !!note.dotted; triplet = !!note.triplet;
    }
    if (typeof name !== 'string') return null;
    const words = name.trim().toLowerCase().split(/[\s-]+/);
    if (words.indexOf('dotted') >= 0) dotted = true;
    if (words.indexOf('triplet') >= 0) triplet = true;
    if (mods && mods.dotted) dotted = true;
    if (mods && mods.triplet) triplet = true;
    const base = words.filter(function (w) { return NOTE_VALUES[w]; })[0];
    if (!base) return null;
    let f = makeFraction(1, NOTE_VALUES[base]);
    if (dotted) f = makeFraction(f.n * 3, f.d * 2);
    if (triplet) f = makeFraction(f.n * 2, f.d * 3);
    return f;
  }

  function noteOf(name, dotted, triplet) {
    return { name: name, dotted: dotted, triplet: triplet, fraction: durationToFraction({ name: name, dotted: dotted, triplet: triplet }) };
  }

  // Plain and dotted notes, longest first, for the greedy split.
  const SPLIT_NOTES = [];
  NOTE_ORDER.forEach(function (name) {
    SPLIT_NOTES.push(noteOf(name, true, false));
    SPLIT_NOTES.push(noteOf(name, false, false));
  });
  SPLIT_NOTES.sort(function (a, b) { return compareFractions(b.fraction, a.fraction); });

  // The notes that spell a length: one note when one note fits exactly
  // (3/8 → dotted quarter, 1/6 → quarter triplet), otherwise tied notes,
  // longest first (5/8 → half + eighth). null when no tie of notes down to a
  // sixteenth adds up to it exactly.
  function fractionToDurations(f) {
    let rest = toFraction(f);
    if (!rest || rest.n <= 0) return null;
    const single = NOTE_ORDER.reduce(function (hit, name) {
      return hit || [noteOf(name, false, false), noteOf(name, true, false), noteOf(name, false, true)]
        .filter(function (note) { return compareFractions(note.fraction, rest) === 0; })[0];
    }, null);
    if (single) return [single];
    const out = [];
    while (rest.n > 0 && out.length < 64) {
      const pick = SPLIT_NOTES.filter(function (note) { return compareFractions(note.fraction, rest) <= 0; })[0];
      if (!pick) return null;
      out.push(pick);
      rest = addFractions(rest, makeFraction(-pick.fraction.n, pick.fraction.d));
    }
    return rest.n === 0 ? out : null;
  }

  // ---------- bars ----------
  const TIME_SIGNATURES = ['4/4', '3/4', '2/4', '6/8'];

  // 'full' | 'short' | 'over', plus how much is missing or extra.
  function measureFill(timeSig, notes) {
    const sig = typeof timeSig === 'string' ? timeSig.replace(/\s+/g, '') : '';
    if (TIME_SIGNATURES.indexOf(sig) < 0 || !Array.isArray(notes)) return null;
    const parts = sig.split('/').map(Number);
    const bar = makeFraction(parts[0], parts[1]);
    let sum = makeFraction(0, 1);
    for (let i = 0; i < notes.length; i++) {
      const f = toFraction(notes[i]);
      if (!f || f.n <= 0) return null;
      sum = addFractions(sum, f);
    }
    const diff = addFractions(bar, makeFraction(-sum.n, sum.d));
    const fill = diff.n === 0 ? 'full' : diff.n > 0 ? 'short' : 'over';
    return { fill: fill, total: sum, bar: bar, remainder: makeFraction(Math.abs(diff.n), diff.d) };
  }

  // ---------- pitch ----------
  const INTERVALS = {
    unison: [1, 1], octave: [2, 1], fifth: [3, 2], fourth: [4, 3], majorthird: [5, 4],
  };

  function intervalRatio(name) {
    if (typeof name !== 'string') return null;
    const r = INTERVALS[name.toLowerCase().replace(/[\s_-]+/g, '')];
    return r ? { p: r[0], q: r[1] } : null;
  }

  function positive(x) {
    return typeof x === 'number' && Number.isFinite(x) && x > 0;
  }

  function ratioToHz(base, p, q) {
    if (!positive(base) || !positive(p) || !positive(q)) return null;
    return base * p / q;
  }

  function harmonic(n, f0) {
    if (!Number.isInteger(n) || n < 1 || !positive(f0)) return null;
    return n * f0;
  }

  // Monochord: sounding a fraction of the string multiplies the pitch by the
  // inverse fraction (1/2 of the string → ×2, an octave; 2/3 → ×3/2, a fifth).
  function stringLength(fraction) {
    const f = toFraction(fraction);
    if (!f || f.n <= 0 || f.n > f.d) return null;
    return makeFraction(f.d, f.n);
  }

  // ---------- tempo ----------
  function bpmToSeconds(bpm) {
    return positive(bpm) ? 60 / bpm : null;
  }

  function tempoChange(bpm, pct) {
    if (!positive(bpm) || typeof pct !== 'number' || !Number.isFinite(pct) || pct <= -100) return null;
    return Math.round(bpm * (100 + pct)) / 100;
  }

  // ---------- safety ----------
  const MAX_GAIN = 0.3;
  const HZ_MIN = 110;
  const HZ_MAX = 1760;
  const ATTACK = 0.01;
  const RELEASE = 0.04;

  function clampHz(hz) {
    if (typeof hz !== 'number' || !Number.isFinite(hz)) return null;
    return Math.min(HZ_MAX, Math.max(HZ_MIN, hz));
  }

  function clampGain(g) {
    if (typeof g !== 'number' || !Number.isFinite(g)) return 0;
    return Math.min(MAX_GAIN, Math.max(0, g));
  }

  // Turns events ({at, dur, hz, gain, type} in seconds, or sequential
  // {fraction, hz} notes when opts.bpm is given) into the clamped notes that
  // will actually sound, starting at `start` on the AudioContext clock.
  function planSequence(events, start, opts) {
    if (!Array.isArray(events)) return [];
    const o = opts || {};
    const t0 = typeof start === 'number' && Number.isFinite(start) ? start : 0;
    const beat = bpmToSeconds(o.bpm);
    let cursor = 0;
    const out = [];
    events.forEach(function (e) {
      if (!e || typeof e !== 'object') return;
      let at = e.at, dur = e.dur;
      const f = e.fraction != null ? toFraction(e.fraction) : null;
      if (f && beat) {
        dur = f.n / f.d * 4 * beat;
        if (at == null) at = cursor;
        cursor = at + dur;
      }
      if (!positive(dur) || typeof at !== 'number' || !Number.isFinite(at) || at < 0) return;
      const hz = e.rest ? null : clampHz(e.hz);
      if (hz != null) {
        out.push({
          time: t0 + at, dur: Math.max(dur, ATTACK + RELEASE), hz: hz,
          gain: clampGain(e.gain == null ? 0.2 : e.gain), type: e.type || 'sine',
        });
      }
    });
    return out;
  }

  let audioCtx = null;

  function unlockAudio() {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') {
      try { audioCtx.resume(); } catch (e) { /* autoplay policy */ }
    }
    return audioCtx;
  }

  function playPlanned(events, opts) {
    const ac = unlockAudio();
    if (!ac || !Array.isArray(events)) return;
    const notes = planSequence(events, ac.currentTime + 0.05, opts || {});
    notes.forEach(function (n) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = n.type || 'sine';
      o.frequency.setValueAtTime(n.hz, n.time);
      g.gain.setValueAtTime(0.0001, n.time);
      g.gain.exponentialRampToValueAtTime(Math.max(n.gain, 0.0002), n.time + ATTACK);
      g.gain.exponentialRampToValueAtTime(0.0001, n.time + n.dur);
      o.connect(g).connect(ac.destination);
      o.start(n.time);
      o.stop(n.time + n.dur + 0.02);
    });
  }

  return {
    makeFraction, toFraction, addFractions, compareFractions, fractionText,
    durationToFraction, fractionToDurations, measureFill, TIME_SIGNATURES,
    intervalRatio, ratioToHz, harmonic, stringLength, bpmToSeconds, tempoChange,
    MAX_GAIN, HZ_MIN, HZ_MAX, clampHz, clampGain, planSequence, unlockAudio, playPlanned,
  };
});
