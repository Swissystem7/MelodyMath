// MelodyMath — WebAudio voices for the world instruments (#591, goal B).
//
// Every timbre is synthesised: oscillators, a short noise burst and a filter.
// No audio files are loaded, so there is nothing to license (SOUNDS-LICENSES.md).
// These are rough approximations of each instrument, good enough to tell a
// drum from a bell from a flute, not recordings.
//
// planVoice(voice, hz) is pure and testable in Node: it returns the nodes to
// build. playVoice(ac, voice, hz, when) renders that plan on an AudioContext
// that the caller already unlocked (musicEngine.getSharedAudioContext()).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // partials: [ratio to hz, gain]; sweep: pitch falls to hz*sweep (drums);
  // noise: gain of a filtered noise burst; attack/decay in seconds.
  // lowFilter: replaces filter below LOW_HZ, so a held 220 Hz ten is not
  // cut away by a high bandpass (#831).
  const VOICES = {
    drumLow: { wave: 'sine', partials: [[1, 1]], sweep: 0.55, noise: 0.15, filter: ['lowpass', 900], attack: 0.002, decay: 0.35, hz: 90 },
    drumHigh: { wave: 'triangle', partials: [[1, 0.6], [1.6, 0.3]], sweep: 0.8, noise: 0.45, filter: ['bandpass', 2500], lowFilter: ['lowpass', 1500], attack: 0.001, decay: 0.12, hz: 330 },
    frameDrum: { wave: 'sine', partials: [[1, 0.8], [2.3, 0.2]], sweep: 0.7, noise: 0.3, filter: ['lowpass', 2000], attack: 0.002, decay: 0.25, hz: 140 },
    jingle: { wave: 'square', partials: [[1, 0.05]], sweep: 1, noise: 0.7, filter: ['highpass', 6000], attack: 0.001, decay: 0.18, hz: 5000 },
    woodClick: { wave: 'sine', partials: [[1, 0.8], [2.8, 0.3]], sweep: 1, noise: 0.1, filter: ['bandpass', 2200], lowFilter: ['lowpass', 1500], attack: 0.001, decay: 0.06, hz: 2000 },
    metalBell: { wave: 'sine', partials: [[1, 0.6], [2.76, 0.3], [5.4, 0.15], [8.93, 0.08]], sweep: 1, noise: 0, filter: null, attack: 0.002, decay: 0.9, hz: 880 },
    gong: { wave: 'sine', partials: [[1, 0.7], [1.48, 0.3], [2.1, 0.2], [2.93, 0.1]], sweep: 0.98, noise: 0.05, filter: ['lowpass', 3000], attack: 0.01, decay: 2.2, hz: 160 },
    woodBar: { wave: 'sine', partials: [[1, 0.8], [4, 0.2], [10, 0.05]], sweep: 1, noise: 0.05, filter: null, attack: 0.002, decay: 0.5, hz: 523 },
    tine: { wave: 'sine', partials: [[1, 0.8], [5.4, 0.12]], sweep: 1, noise: 0.03, filter: null, attack: 0.002, decay: 0.8, hz: 587 },
    steelPan: { wave: 'sine', partials: [[1, 0.6], [2, 0.35], [3, 0.15]], sweep: 1, noise: 0.02, filter: null, attack: 0.003, decay: 0.7, hz: 523 },
    pluck: { wave: 'sawtooth', partials: [[1, 0.5], [2, 0.15]], sweep: 1, noise: 0.05, filter: ['lowpass', 2400], attack: 0.003, decay: 0.6, hz: 196 },
    bowed: { wave: 'sawtooth', partials: [[1, 0.45]], sweep: 1, noise: 0, filter: ['lowpass', 3000], attack: 0.08, decay: 0.9, hz: 440, vibrato: [5.5, 4] },
    breathy: { wave: 'sine', partials: [[1, 0.7], [2, 0.1]], sweep: 1, noise: 0.12, filter: ['bandpass', 1800], attack: 0.05, decay: 0.7, hz: 587, vibrato: [5, 3] },
    reed: { wave: 'square', partials: [[1, 0.3]], sweep: 1, noise: 0.03, filter: ['lowpass', 2500], attack: 0.03, decay: 0.8, hz: 349 },
    horn: { wave: 'sawtooth', partials: [[1, 0.5], [1.5, 0.1]], sweep: 1, noise: 0.05, filter: ['lowpass', 1400], attack: 0.06, decay: 0.9, hz: 233 },
    drone: { wave: 'sawtooth', partials: [[1, 0.5], [2, 0.2]], sweep: 1, noise: 0.08, filter: ['lowpass', 700], attack: 0.1, decay: 1.2, hz: 73, vibrato: [6, 2] },
    keys: { wave: 'triangle', partials: [[1, 0.6], [2, 0.2], [3, 0.08]], sweep: 1, noise: 0.01, filter: ['lowpass', 4000], attack: 0.004, decay: 0.8, hz: 262 },
    organ: { wave: 'sine', partials: [[1, 0.5], [2, 0.3], [4, 0.15]], sweep: 1, noise: 0, filter: null, attack: 0.03, decay: 1, hz: 262 },
  };

  const MAX_GAIN = 0.3; // same ceiling idea as musicEngine.MAX_GAIN: gentle on small ears
  const LOW_HZ = 250; // catches the 110/220 Hz ten; C4 (streak tunes) and 330 Hz keep their filter

  function planVoice(voice, hz) {
    const v = VOICES[voice];
    if (!v) return null;
    const f = Number(hz) > 0 ? Number(hz) : v.hz;
    const total = v.partials.reduce(function (s, p) { return s + p[1]; }, 0) + v.noise;
    const scale = total > 0 ? MAX_GAIN / Math.max(total, 1) : 0;
    const filter = v.lowFilter && f < LOW_HZ ? v.lowFilter : v.filter;
    return {
      oscillators: v.partials.map(function (p) {
        return { type: v.wave, hz: f * p[0], endHz: f * p[0] * v.sweep, gain: p[1] * scale };
      }),
      noise: v.noise * scale,
      filter: filter ? { type: filter[0], hz: filter[1] } : null,
      attack: v.attack,
      decay: v.decay,
      vibrato: v.vibrato ? { rate: v.vibrato[0], cents: v.vibrato[1] } : null,
    };
  }

  let noiseBuf = null;
  function noiseBuffer(ac) {
    if (noiseBuf && noiseBuf.sampleRate === ac.sampleRate) return noiseBuf;
    const len = Math.floor(ac.sampleRate * 0.5);
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  // Renders one note. Returns the stop time, or null without an AudioContext.
  // opts.dur (seconds) holds that one note longer; opts.gain above 0.16
  // raises the envelope, still capped at 1. Omitted opts keep the voice plan.
  function playVoice(ac, voice, hz, when, dest, opts) {
    const plan = planVoice(voice, hz);
    if (!ac || !plan) return null;
    const t = typeof when === 'number' ? when : ac.currentTime;
    const held = opts && Number(opts.dur) > 0 ? Number(opts.dur) : 0;
    const end = t + (held || plan.attack + plan.decay);
    const peak = held && Number(opts.gain) > 0 ? Math.min(1, Number(opts.gain) / 0.16) : 1;
    const out = ac.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(peak, t + (held ? Math.min(plan.attack, held) : plan.attack));
    out.gain.exponentialRampToValueAtTime(0.0001, end);
    let bus = out;
    if (plan.filter) {
      const bq = ac.createBiquadFilter();
      bq.type = plan.filter.type;
      bq.frequency.value = plan.filter.hz;
      bq.connect(out);
      bus = bq;
    }
    out.connect(dest || ac.destination);
    plan.oscillators.forEach(function (o) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = o.type;
      osc.frequency.setValueAtTime(o.hz, t);
      if (o.endHz !== o.hz) osc.frequency.exponentialRampToValueAtTime(o.endHz, end);
      if (plan.vibrato) {
        const lfo = ac.createOscillator();
        const depth = ac.createGain();
        lfo.frequency.value = plan.vibrato.rate;
        depth.gain.value = o.hz * (Math.pow(2, plan.vibrato.cents / 1200) - 1);
        lfo.connect(depth).connect(osc.frequency);
        lfo.start(t);
        lfo.stop(end + 0.02);
      }
      g.gain.value = o.gain;
      osc.connect(g).connect(bus);
      osc.start(t);
      osc.stop(end + 0.02);
    });
    if (plan.noise > 0) {
      const src = ac.createBufferSource();
      const g = ac.createGain();
      src.buffer = noiseBuffer(ac);
      g.gain.setValueAtTime(plan.noise, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(plan.decay, 0.15));
      src.connect(g).connect(bus);
      src.start(t);
      src.stop(end + 0.02);
    }
    return end;
  }

  return { VOICES, MAX_GAIN, planVoice, playVoice };
});
