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

  // 'quarter', 'dotted quarter', 'quarter triplet', or {name, dotted, triplet}
  // → {name, dotted, triplet} with a base name we know, or null.
  function parseDuration(note, mods) {
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
    return base ? { name: base, dotted: dotted, triplet: triplet } : null;
  }

  function durationToFraction(note, mods) {
    const p = parseDuration(note, mods);
    if (!p) return null;
    let f = makeFraction(1, NOTE_VALUES[p.name]);
    if (p.dotted) f = makeFraction(f.n * 3, f.d * 2);
    if (p.triplet) f = makeFraction(f.n * 2, f.d * 3);
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

  // An exponential ramp can approach zero but never reach it, so a note fades
  // to SILENT instead of 0. Jumping straight to full gain clicks, which on a
  // tablet speaker is louder than the note itself; every note gets a short
  // attack and release. Pure, so the shape is testable without an audio device.
  const SILENT = 0.0001;

  function envelopePoints(peak, start, dur) {
    if (!positive(dur) || typeof start !== 'number' || !Number.isFinite(start) || start < 0) return null;
    const level = Math.max(clampGain(peak), SILENT);
    const attack = Math.min(ATTACK, dur / 2);
    const release = Math.min(RELEASE, dur - attack);
    return [
      { t: start, v: SILENT },
      { t: start + attack, v: level },
      { t: start + dur - release, v: level },
      { t: start + dur, v: SILENT },
    ];
  }

  // ---------- the one AudioContext ----------
  // Every page shares this context: sonify.js borrows it instead of building
  // its own, so a tablet never has two contexts competing for the single iOS
  // audio session. Inert in Node, where there is no window.
  let sharedCtx = null;
  let warmed = false;
  let unlockInstalled = false;
  const live = [];

  function audioSupported() {
    return typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
  }

  // Built on first use, never at load: an AudioContext created before a user
  // gesture would be born suspended and, on iOS, count against the page.
  function getSharedAudioContext() {
    if (!audioSupported()) return null;
    if (!sharedCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      sharedCtx = new AC();
    }
    return sharedCtx;
  }

  // 'unsupported' · 'idle' (nothing built yet, so nothing can have sounded) ·
  // then whatever the context reports: 'suspended' | 'running' | 'closed'.
  function audioState() {
    if (!audioSupported()) return 'unsupported';
    return sharedCtx ? sharedCtx.state : 'idle';
  }

  // iOS Safari starts audio only inside a user gesture, and resume() on its own
  // leaves the context 'suspended' until something has actually played — hence
  // the one silent sample. Call this from the first pointerdown.
  function unlockAudio() {
    const ac = getSharedAudioContext();
    if (!ac) return null;
    if (ac.state !== 'running' && typeof ac.resume === 'function') {
      try { ac.resume(); } catch (e) { /* autoplay policy said no */ }
    }
    if (!warmed) {
      try {
        const src = ac.createBufferSource();
        src.buffer = ac.createBuffer(1, 1, ac.sampleRate);
        src.connect(ac.destination);
        src.start(0);
        warmed = true;
      } catch (e) { /* nothing to warm up */ }
    }
    return ac;
  }

  // One set of listeners for the whole app (plan §4.3). Capture phase, so the
  // tap unlocks even when a widget stops the event; left attached rather than
  // `once`, because iOS suspends the context again whenever the tab goes to
  // the background and the next tap has to wake it.
  function installAudioUnlock(target) {
    const t = target || (typeof document !== 'undefined' ? document : null);
    if (!t || typeof t.addEventListener !== 'function' || unlockInstalled) return false;
    unlockInstalled = true;
    ['pointerdown', 'touchend', 'keydown'].forEach(function (ev) {
      t.addEventListener(ev, function () {
        if (audioState() !== 'running') unlockAudio();
      }, { capture: true, passive: true });
    });
    return true;
  }

  function stopSequence() {
    live.forEach(function (osc) {
      try { osc.stop(); } catch (e) { /* already stopped */ }
      try { osc.disconnect(); } catch (e) { /* already gone */ }
    });
    live.length = 0;
  }

  // Play `events` on the shared context. Every note is pinned to an absolute
  // time on the audio clock (currentTime + a lead-in), never to setTimeout, so
  // a rhythm stays a rhythm while the main thread is busy rendering. Returns
  // the notes it scheduled — the clamped, audible truth.
  const LEAD_IN = 0.05;
  let lastPlayed = null;

  function scheduleSequence(events, opts) {
    const ac = getSharedAudioContext();
    if (!ac) return [];
    const o = opts || {};
    if (o.replace !== false) stopSequence();
    const notes = planSequence(events, ac.currentTime + LEAD_IN, o);
    if (notes.length) lastPlayed = { events: events, opts: o };
    notes.forEach(function (note) {
      const points = envelopePoints(note.gain, note.time, note.dur);
      if (!points) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = note.type;
      osc.frequency.setValueAtTime(note.hz, note.time);
      gain.gain.setValueAtTime(points[0].v, points[0].t);
      for (let i = 1; i < points.length; i++) {
        gain.gain.exponentialRampToValueAtTime(points[i].v, points[i].t);
      }
      osc.connect(gain).connect(ac.destination);
      osc.start(note.time);
      osc.stop(note.time + note.dur + 0.02);
      live.push(osc);
      osc.onended = function () {
        const i = live.indexOf(osc);
        if (i >= 0) live.splice(i, 1);
      };
    });
    return notes;
  }

  // Backs the "play again" button every activity has to show (plan §4.3): the
  // same events, timed fresh against the audio clock. canReplay() tells the UI
  // whether there is anything to replay yet.
  function canReplay() {
    return !!lastPlayed;
  }

  function replaySequence() {
    return lastPlayed ? scheduleSequence(lastPlayed.events, lastPlayed.opts) : [];
  }

  // ---------- text for ears that cannot hear it ----------
  // Every sounding event also has a Hebrew line, the pattern access.js uses:
  // a tap that only makes a noise does not exist for a screen reader.
  const HE_NOTES = {
    whole: ['שלם', 'מנוקד'],
    half: ['חצי', 'מנוקד'],
    quarter: ['רבע', 'מנוקד'],
    eighth: ['שמינית', 'מנוקדת'],
    sixteenth: ['שש־עשרית', 'מנוקדת'],
  };

  function durationText(note, mods) {
    const p = parseDuration(note, mods);
    if (!p) return '';
    const he = HE_NOTES[p.name];
    let s = he[0];
    if (p.dotted) s += ' ' + he[1];
    if (p.triplet) s += ' בטריולה';
    return s;
  }

  // A length as notes if notes can spell it ('3/8' → 'רבע מנוקד',
  // '5/8' → 'חצי ועוד שמינית'), otherwise as the bare fraction.
  function lengthText(x) {
    const notes = fractionToDurations(x);
    if (notes) {
      const words = notes.map(function (n) { return durationText(n); }).filter(Boolean);
      if (words.length) return words.join(' ועוד ');
    }
    return fractionText(x);
  }

  function sequenceNarration(events) {
    if (!Array.isArray(events)) return '';
    return events.map(function (e) {
      if (!e || typeof e !== 'object') return '';
      const text = e.label || lengthText(e.fraction != null ? e.fraction : e.duration);
      if (!text) return '';
      return e.rest ? 'הפסקה ' + text : text;
    }).filter(Boolean).join(', ');
  }

  // What a muted or sound-less tablet shows instead. No claim that the sound is
  // required in order to learn the exercise.
  function audioStatusText(state) {
    const s = state || audioState();
    if (s === 'unsupported') return 'הדפדפן הזה לא משמיע צליל. התרגיל מוצג בטקסט.';
    if (s === 'running') return 'הצליל פעיל. אם לא שומעים, בדקו את מתג ההשתקה ואת עוצמת הקול.';
    return 'געו במסך כדי להפעיל את הצליל. אפשר גם לקרוא את התרגיל בטקסט.';
  }

  return {
    makeFraction, toFraction, addFractions, compareFractions, fractionText,
    parseDuration, durationToFraction, fractionToDurations, measureFill, TIME_SIGNATURES,
    intervalRatio, ratioToHz, harmonic, stringLength, bpmToSeconds, tempoChange,
    MAX_GAIN, HZ_MIN, HZ_MAX, ATTACK, RELEASE, clampHz, clampGain, planSequence,
    envelopePoints, audioSupported, getSharedAudioContext, audioState, unlockAudio,
    installAudioUnlock, scheduleSequence, stopSequence, canReplay, replaySequence,
    durationText, lengthText, sequenceNarration, audioStatusText,
  };
});
