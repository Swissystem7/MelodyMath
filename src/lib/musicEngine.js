// MelodyMath — the shared music engine (plan §3).
//
// Pure music arithmetic first: note lengths as exact fractions, bar filling,
// interval ratios, the harmonic series, the monochord and tempo. Fractions are
// {n, d} pairs in lowest terms and are never turned into floats, so
// 1/4 + 1/8 + 1/8 + 1/2 is exactly one bar and not 0.9999999.
//
// Then the one AudioContext of the page. sonify.js asks for it through
// getSharedAudioContext(), so the slider tone, the metronome click and every
// new activity share a single context, unlocked by unlockAudio() on the first
// tap (iOS Safari plays nothing before a user gesture). Inert in Node.
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

  // ---------- instant tap voices (#591 goal A) ----------
  // Every voice is synthesised, so there is no file to fetch, decode or
  // license, and a tap starts sounding on the very next audio quantum. Each
  // part is {at, dur, hz, gain, type}; `noise` parts use the white-noise buffer
  // built once while the context is unlocked.
  const PENTA = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
  const TAP_VOICES = {
    kick: [{ at: 0, dur: 0.14, hz: 82, gain: 0.3, type: 'sine', drop: 45 }],
    snare: [{ at: 0, dur: 0.08, hz: 280, gain: 0.16, type: 'triangle' }, { at: 0, dur: 0.09, noise: true, gain: 0.12 }],
    hihat: [{ at: 0, dur: 0.035, noise: true, gain: 0.08 }],
    clap: [{ at: 0, dur: 0.03, noise: true, gain: 0.14 }, { at: 0.015, dur: 0.05, noise: true, gain: 0.1 }],
    drum: [{ at: 0, dur: 0.16, hz: 120, gain: 0.26, type: 'sine', drop: 70 }, { at: 0, dur: 0.04, noise: true, gain: 0.06 }],
    xylo: [{ at: 0, dur: 0.32, hz: 0, gain: 0.24, type: 'sine' }, { at: 0, dur: 0.12, hz: 0, mul: 2.76, gain: 0.07, type: 'sine' }],
    bell: [{ at: 0, dur: 0.6, hz: 0, gain: 0.18, type: 'sine' }, { at: 0, dur: 0.4, hz: 0, mul: 2.4, gain: 0.06, type: 'sine' }],
    // Feedback: a soft rising third for right, a soft falling step for wrong.
    // Neither is loud or harsh: a wrong answer is information, not a buzzer.
    correct: [{ at: 0, dur: 0.14, hz: 523.25, gain: 0.16, type: 'triangle' }, { at: 0.1, dur: 0.22, hz: 659.25, gain: 0.16, type: 'triangle' }],
    wrong: [{ at: 0, dur: 0.16, hz: 329.63, gain: 0.1, type: 'sine' }, { at: 0.13, dur: 0.24, hz: 293.66, gain: 0.08, type: 'sine' }],
  };

  // The parts a voice plays. `step` picks the pitch of a pitched voice (xylo,
  // bell) on a C pentatonic ladder, so any two bars sound well together.
  // An explicit `hz` (a xylophone bar that already has its own pitch) wins.
  function tapPlan(voice, step, hz) {
    const parts = TAP_VOICES[voice];
    if (!parts) return [];
    const s = Math.max(0, Math.min(PENTA.length - 1, Math.round(Number(step) || 0)));
    const base = positive(hz) ? clampHz(hz) : PENTA[s];
    return parts.map(function (p) {
      const out = Object.assign({}, p);
      if (!p.noise && !p.hz) out.hz = base * (p.mul || 1);
      delete out.mul;
      out.gain = clampGain(p.gain);
      return out;
    });
  }

  function nowMs() {
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  }

  // window.audioState(): 'idle' before any context exists, then the context's
  // own state. Its properties are what the e2e latency test reads:
  // lastStart = performance.now() when the last tap sound was started,
  // lastEventTime = the timeStamp of the pointerdown that asked for it.
  function audioState() {
    return audioCtx ? audioCtx.state : 'idle';
  }
  audioState.lastStart = null;
  audioState.lastEventTime = null;
  audioState.lastVoice = null;
  audioState.taps = 0;
  audioState.muted = false;

  function setMuted(on) {
    audioState.muted = !!on;
    if (on) stopSequence();
    return audioState.muted;
  }

  let noiseBuffer = null;
  function getNoise(ac) {
    if (noiseBuffer) return noiseBuffer;
    try {
      const len = Math.floor((ac.sampleRate || 44100) * 0.2);
      noiseBuffer = ac.createBuffer(1, len, ac.sampleRate || 44100);
      const data = noiseBuffer.getChannelData ? noiseBuffer.getChannelData(0) : null;
      for (let i = 0; data && i < len; i++) data[i] = Math.random() * 2 - 1;
    } catch (e) { noiseBuffer = null; }
    return noiseBuffer;
  }

  // Plays a voice now: no lookahead and no setTimeout, so the sound starts on
  // the next audio quantum after the pointerdown that asked for it.
  function playTap(voice, opts) {
    const o = opts || {};
    const parts = tapPlan(voice, o.step, o.hz);
    if (!parts.length || audioState.muted) return null;
    const ac = getSharedAudioContext();
    if (!ac) return null;
    if (ac.state === 'suspended') { try { ac.resume(); } catch (e) { /* autoplay policy */ } }
    const t0 = ac.currentTime;
    parts.forEach(function (p) {
      const t = t0 + p.at;
      const g = ac.createGain();
      let src;
      if (p.noise) {
        src = ac.createBufferSource();
        src.buffer = getNoise(ac);
      } else {
        src = ac.createOscillator();
        src.type = p.type || 'sine';
        src.frequency.setValueAtTime(p.hz, t);
        if (p.drop) src.frequency.exponentialRampToValueAtTime(p.drop, t + p.dur);
      }
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(p.gain, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p.dur);
      src.connect(g).connect(ac.destination);
      src.start(t);
      src.stop(t + p.dur + 0.02);
    });
    audioState.lastStart = nowMs();
    audioState.lastEventTime = typeof o.eventTime === 'number' ? o.eventTime : audioState.lastStart;
    audioState.lastVoice = voice;
    audioState.taps += 1;
    return { startTime: t0, parts: parts.length };
  }

  // ---------- tap feedback (#591 goal A.2) ----------
  // Any element with data-tap="<voice>" (plus data-hz or data-step) sounds on
  // pointerdown, gets the .mm-tap press/bounce/glow and a 10 ms buzz where the
  // device supports it. pointerdown fires once per finger, so chords and
  // two-hand play work. The CSS turns the bounce into a still glow under
  // prefers-reduced-motion.
  function tapFeedback(el, ev) {
    if (!el || typeof el.getAttribute !== 'function') return null;
    const voice = el.getAttribute('data-tap');
    if (!voice || el.disabled) return null;
    const r = playTap(voice, {
      step: Number(el.getAttribute('data-step')) || 0,
      hz: Number(el.getAttribute('data-hz')) || null,
      eventTime: ev && typeof ev.timeStamp === 'number' && ev.timeStamp > 0 ? ev.timeStamp : undefined,
    });
    if (el.classList) {
      el.classList.remove('mm-tap');
      void el.offsetWidth; // restart the animation on a quick second tap
      el.classList.add('mm-tap');
      setTimeout(function () { el.classList.remove('mm-tap'); }, 220);
    }
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    if (nav && typeof nav.vibrate === 'function') { try { nav.vibrate(10); } catch (e) { /* not allowed */ } }
    return r;
  }

  function tapTargetOf(ev) {
    const t = ev && ev.target;
    return t && typeof t.closest === 'function' ? t.closest('[data-tap]') : null;
  }

  function installTapFeedback(target) {
    const t = target || (typeof document !== 'undefined' ? document : null);
    if (!t || typeof t.addEventListener !== 'function') return false;
    // Capture phase: the sound starts before any game logic on the element.
    t.addEventListener('pointerdown', function (e) { tapFeedback(tapTargetOf(e), e); }, { capture: true, passive: true });
    // Enter/Space on a focused element fires a click with detail 0 and no
    // pointerdown: keyboard players hear the same sound.
    t.addEventListener('click', function (e) { if (e.detail === 0) tapFeedback(tapTargetOf(e), e); });
    return true;
  }

  // ---------- the shared AudioContext ----------
  let audioCtx = null;
  const live = [];

  function getSharedAudioContext() {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      // 'interactive' asks the browser for its smallest output buffer.
      try { audioCtx = new AC({ latencyHint: 'interactive' }); } catch (e) { audioCtx = new AC(); }
      noiseBuffer = null;
    }
    return audioCtx;
  }

  // Call from a user gesture. Resumes the context and plays one silent sample,
  // which is what iOS Safari needs before it lets any later sound through.
  function unlockAudio() {
    const ac = getSharedAudioContext();
    if (!ac) return Promise.resolve('unavailable');
    try {
      const src = ac.createBufferSource();
      src.buffer = ac.createBuffer(1, 1, 22050);
      src.connect(ac.destination);
      src.start(0);
    } catch (e) { /* older engines */ }
    getNoise(ac); // pre-warm: the drum voices never build a buffer on a tap
    if (ac.state === 'running') return Promise.resolve('running');
    let p;
    try { p = ac.resume(); } catch (e) { p = null; }
    return Promise.resolve(p).then(function () { return ac.state; }, function () { return ac.state; });
  }

  // Unlocks on the first pointerdown (or key press, for keyboard users).
  function installAudioUnlock(target) {
    const t = target || (typeof document !== 'undefined' ? document : null);
    if (!t || typeof t.addEventListener !== 'function') return false;
    function once() {
      t.removeEventListener('pointerdown', once, true);
      t.removeEventListener('keydown', once, true);
      unlockAudio();
    }
    t.addEventListener('pointerdown', once, true);
    t.addEventListener('keydown', once, true);
    return true;
  }

  function stopSequence() {
    live.forEach(function (node) {
      try { node.stop(); } catch (e) { /* already stopped */ }
      try { node.disconnect(); } catch (e) { /* already gone */ }
    });
    live.length = 0;
  }

  function audioReady() {
    return !!(audioCtx && audioCtx.state === 'running');
  }

  function stopAll() {
    stopSequence();
  }

  // Schedules on AudioContext.currentTime, never setTimeout, so long
  // sequences keep their timing on a busy phone.
  let lastEvents = null;
  let lastOpts = null;

  function scheduleSequence(events, opts) {
    const ac = getSharedAudioContext();
    if (!ac || audioState.muted) return null;
    stopSequence();
    if (Array.isArray(events)) { lastEvents = events.slice(); lastOpts = opts; }
    const start = ac.currentTime + 0.05;
    const plan = planSequence(events, start, opts);
    plan.forEach(function (note) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = note.type;
      o.frequency.setValueAtTime(note.hz, note.time);
      g.gain.setValueAtTime(0.0001, note.time);
      g.gain.linearRampToValueAtTime(note.gain, note.time + ATTACK);
      g.gain.setValueAtTime(note.gain, note.time + note.dur - RELEASE);
      g.gain.linearRampToValueAtTime(0.0001, note.time + note.dur);
      o.connect(g).connect(ac.destination);
      o.start(note.time);
      o.stop(note.time + note.dur + 0.02);
      live.push(o);
    });
    const end = plan.reduce(function (m, n) { return Math.max(m, n.time + n.dur); }, start);
    return { startTime: start, endTime: end, notes: plan.length, plan: plan };
  }

  // "Play it again": the last sequence, re-timed from now. Returns the notes
  // that sound ([] when there is nothing to replay).
  function canReplay() {
    return !!(lastEvents && lastEvents.length);
  }

  function replaySequence() {
    if (!canReplay()) return [];
    const r = scheduleSequence(lastEvents, lastOpts);
    return r ? r.plan : [];
  }

  const api = {
    makeFraction, toFraction, addFractions, compareFractions, fractionText,
    durationToFraction, fractionToDurations, measureFill, TIME_SIGNATURES,
    intervalRatio, ratioToHz, harmonic, stringLength, bpmToSeconds, tempoChange,
    MAX_GAIN, HZ_MIN, HZ_MAX, clampHz, clampGain, planSequence,
    ratioText, hzText, harmonicSeries, commonDifference, stringStops,
    monochordHz, monochordInterval, temperedRatio, ratioDriftPercent,
    parseRatio, ratioMatches,
    getSharedAudioContext, unlockAudio, installAudioUnlock, scheduleSequence,
    stopSequence, stopAll, audioReady,
    isAudioUnlocked: audioReady, playSequence: scheduleSequence,
    canReplay, replaySequence, TAP_VOICES, tapPlan, playTap, audioState, setMuted,
    tapFeedback, installTapFeedback,
  };
  // Later scripts reuse some global names (bar44.js has its own measureFill),
  // so the engine is also reachable under one name that nothing overwrites.
  api.musicEngine = api;
  return api;
});
