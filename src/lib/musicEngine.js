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

  // ---------- the frequency lab (plan §6) ----------
  function ratioText(p, q) {
    const f = makeFraction(p, q == null ? 1 : q);
    return f && f.n > 0 ? f.n + ':' + f.d : '';
  }

  function hzText(hz) {
    if (!positive(hz)) return '';
    const r = Math.round(hz * 10) / 10;
    return (Number.isInteger(r) ? String(r) : r.toFixed(1)) + ' Hz';
  }

  // The first `count` partials of f0. The nth is n·f0, so neighbours always sit
  // f0 apart: the series is arithmetic with difference f0, even though the
  // musical interval between neighbours keeps shrinking.
  function harmonicSeries(f0, count) {
    const n = Math.round(Number(count));
    if (!positive(f0) || !Number.isInteger(n) || n < 1 || n > 16) return [];
    const out = [];
    for (let i = 1; i <= n; i++) out.push({ n: i, hz: harmonic(i, f0), gap: i === 1 ? 0 : f0 });
    return out;
  }

  // The step of an arithmetic sequence, or null when the steps differ.
  function commonDifference(nums) {
    if (!Array.isArray(nums) || nums.length < 2) return null;
    const all = nums.map(Number);
    if (all.some(function (x) { return !Number.isFinite(x); })) return null;
    const d = all[1] - all[0];
    for (let i = 2; i < all.length; i++) {
      if (Math.abs(all[i] - all[i - 1] - d) > 1e-9) return null;
    }
    return d;
  }

  // The stops the monochord slider steps through, longest string first. They are
  // kept as simple fractions so every pitch on screen is an exact ratio.
  const STRING_STOPS = [[1, 1], [7, 8], [5, 6], [4, 5], [3, 4], [2, 3], [3, 5], [1, 2]];

  function stringStops() {
    return STRING_STOPS.map(function (r) { return makeFraction(r[0], r[1]); });
  }

  function monochordHz(base, fraction) {
    const inv = stringLength(fraction);
    return inv ? ratioToHz(base, inv.n, inv.d) : null;
  }

  // The interval a fraction of the string gives, when it is one we name.
  function monochordInterval(fraction) {
    const inv = stringLength(fraction);
    if (!inv) return null;
    const names = Object.keys(INTERVALS);
    for (let i = 0; i < names.length; i++) {
      const r = INTERVALS[names[i]];
      if (r[0] === inv.n && r[1] === inv.d) return names[i];
    }
    return null;
  }

  // 12-TET cuts the octave into twelve equal steps, so one step is the number
  // that reaches ×2 after twelve multiplications. Callers only ever read the
  // result as a plain number, so no fractional power has to be taught.
  function temperedRatio(semitones) {
    const n = Number(semitones);
    return Number.isFinite(n) ? Math.pow(2, n / 12) : null;
  }

  // How far `a` sits above `b`, in percent, to two decimals.
  function ratioDriftPercent(a, b) {
    if (!positive(a) || !positive(b)) return null;
    return Math.round((a / b - 1) * 10000) / 100;
  }

  // Reads '2', '2:1', 'פי 2', '3/2' or '1.5' as one number: the ratio asked for.
  function parseRatio(text) {
    if (typeof text !== 'string') return null;
    const t = text.replace(/[פיx×*]/g, ' ').replace(/,/g, '.').trim();
    const pair = t.match(/^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/);
    if (pair) {
      const a = Number(pair[1]), b = Number(pair[2]);
      return a > 0 && b > 0 ? a / b : null;
    }
    const one = t.match(/^(\d+(?:\.\d+)?)$/);
    return one && Number(one[1]) > 0 ? Number(one[1]) : null;
  }

  // True when the typed answer means p:q. Decimals pass within 0.01, so 1.5
  // counts for 3:2 and a child may answer either way.
  function ratioMatches(text, p, q) {
    const v = parseRatio(text);
    if (v == null || !positive(p) || !positive(q)) return false;
    return Math.abs(v - p / q) < 0.01;
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

  // ---------- audio runtime ----------
  // Everything above is pure and runs in Node. This part needs a browser and
  // stays inert without one, so `node --test` still loads the file.
  let ctx = null;
  const sounding = [];

  // iOS Safari keeps the context suspended until a user gesture, and only
  // really starts its clock once something has played, hence the silent blip.
  // Call this from the first `pointerdown` or `keydown`.
  function unlockAudio() {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') {
      try { ctx.resume(); } catch (e) { /* autoplay policy */ }
    }
    try {
      const blip = ctx.createBufferSource();
      blip.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      blip.connect(ctx.destination);
      blip.start(0);
    } catch (e) { /* older WebKit */ }
    return ctx;
  }

  function audioReady() {
    return !!(ctx && ctx.state === 'running');
  }

  function stopAll() {
    while (sounding.length) {
      const osc = sounding.pop();
      try { osc.stop(); } catch (e) { /* already stopped */ }
      try { osc.disconnect(); } catch (e) { /* already gone */ }
    }
  }

  // Plays exactly what planSequence() worked out, one oscillator per note, with
  // a short attack and release so neither end clicks. Returns the notes that
  // sounded, which is also the text a screen reader is given.
  function scheduleSequence(events, opts) {
    const ac = unlockAudio();
    if (!ac) return [];
    stopAll();
    const notes = planSequence(events, ac.currentTime + 0.06, opts);
    notes.forEach(function (note) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = note.type;
      osc.frequency.setValueAtTime(note.hz, note.time);
      gain.gain.setValueAtTime(0, note.time);
      gain.gain.linearRampToValueAtTime(note.gain, note.time + ATTACK);
      gain.gain.setValueAtTime(note.gain, note.time + note.dur - RELEASE);
      gain.gain.linearRampToValueAtTime(0, note.time + note.dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(note.time);
      osc.stop(note.time + note.dur + 0.02);
      sounding.push(osc);
    });
    return notes;
  }

  return {
    makeFraction, toFraction, addFractions, compareFractions, fractionText,
    durationToFraction, fractionToDurations, measureFill, TIME_SIGNATURES,
    intervalRatio, ratioToHz, harmonic, stringLength, bpmToSeconds, tempoChange,
    MAX_GAIN, HZ_MIN, HZ_MAX, clampHz, clampGain, planSequence,
    ratioText, hzText, harmonicSeries, commonDifference, stringStops,
    monochordHz, monochordInterval, temperedRatio, ratioDriftPercent,
    parseRatio, ratioMatches,
    unlockAudio, audioReady, stopAll, scheduleSequence,
  };
});
