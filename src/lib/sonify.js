// MelodyMath — mapping a vertical position to a pitch.
//
// Recovered from lib/y-to-freq.js, which commit 24fcc95 deleted as an "unused
// lib layer" — it was not unused, index.html carried its own inlined copy and
// the tests died with the module. One definition again, and it is tested.
//
// A y value is mapped linearly onto MIDI 48..84 (C3..C6) and then converted to
// a frequency. The range is deliberately three octaves: wide enough to hear a
// slope, narrow enough to stay comfortable on laptop speakers.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MIDI_LOW = 48;   // C3
  const MIDI_HIGH = 84;  // C6
  const MIDI_A4 = 69;
  const FREQ_A4 = 440;
  const FMIN = 130.81;   // C3 Hz — one ear-range for every page
  const FMAX = 1046.5;   // C6 Hz

  function midiToFreq(midi) {
    return FREQ_A4 * Math.pow(2, (midi - MIDI_A4) / 12);
  }

  // Map a note length (fraction of a whole note) to a printed name.
  // Must compare numerically: String(0.25) is "0.25", never ".25".
  const NOTE_NAMES = [
    [1, '1'],
    [2 / 3, '2/3'],
    [1 / 2, '1/2'],
    [3 / 8, '3/8'],
    [1 / 3, '1/3'],
    [1 / 4, '1/4'],
    [3 / 16, '3/16'],
    [1 / 8, '1/8'],
    [1 / 16, '1/16'],
  ];

  function fractionName(n) {
    if (typeof n !== 'number' || !isFinite(n)) return String(n);
    const hit = NOTE_NAMES.find(([v]) => Math.abs(n - v) < 1e-9);
    return hit ? hit[1] : n.toFixed(3);
  }

  function formatRhythmPattern(pattern) {
    if (!Array.isArray(pattern)) return '';
    return pattern.map(fractionName).join('+');
  }

  function yToFreq(y, yMin, yMax) {
    if (typeof y !== 'number' || !isFinite(y)) return null;
    // A flat function has no range to map onto; answer with the middle pitch
    // rather than dividing by zero.
    if (yMin === yMax) return midiToFreq(66);
    const clamped = Math.min(Math.max(y, yMin), yMax);
    const t = (clamped - yMin) / (yMax - yMin);
    return midiToFreq(MIDI_LOW + t * (MIDI_HIGH - MIDI_LOW));
  }

  // Shared Web Audio helper. Inert in Node (no window / AudioContext) so the
  // same file stays testable. One context is reused by the lab slider tone
  // and by rhythm clicks; callers must go through a user gesture first.
  let audioCtx = null;
  let heldOsc = null;
  let heldGain = null;
  let heldStopTimer = null;
  const scheduled = [];

  function getAudioContext() {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') {
      try { audioCtx.resume(); } catch (e) { /* autoplay policy */ }
    }
    return audioCtx;
  }

  function stopHeldTone() {
    if (heldStopTimer) {
      clearTimeout(heldStopTimer);
      heldStopTimer = null;
    }
    if (heldOsc) {
      try { heldOsc.stop(); } catch (e) { /* already stopped */ }
      try { heldOsc.disconnect(); } catch (e) { /* already gone */ }
      heldOsc = null;
    }
    if (heldGain) {
      try { heldGain.disconnect(); } catch (e) { /* already gone */ }
      heldGain = null;
    }
  }

  function stopScheduled() {
    scheduled.forEach(function (node) {
      try { node.stop(); } catch (e) { /* already stopped */ }
      try { node.disconnect(); } catch (e) { /* already gone */ }
    });
    scheduled.length = 0;
  }

  let voiceOsc = null;
  let voiceGain = null;
  let sweepOsc = null;

  function startVoice() {
    const ac = getAudioContext();
    if (!ac) return null;
    stopVoice();
    voiceOsc = ac.createOscillator();
    voiceGain = ac.createGain();
    voiceOsc.type = 'sine';
    voiceGain.gain.value = 0;
    voiceOsc.connect(voiceGain).connect(ac.destination);
    voiceOsc.start();
    return ac;
  }

  function setVoice(freq, gainVal) {
    const ac = getAudioContext();
    if (!ac || !voiceOsc || !voiceGain) return;
    if (freq != null && isFinite(freq) && freq > 0) {
      voiceOsc.frequency.setTargetAtTime(freq, ac.currentTime, 0.01);
    }
    if (gainVal != null && isFinite(gainVal)) {
      voiceGain.gain.setTargetAtTime(Math.max(0, gainVal), ac.currentTime, 0.01);
    }
  }

  function stopVoice() {
    if (voiceOsc) {
      try { voiceOsc.stop(); } catch (e) { /* already stopped */ }
      try { voiceOsc.disconnect(); } catch (e) { /* already gone */ }
      voiceOsc = null;
    }
    if (voiceGain) {
      try { voiceGain.disconnect(); } catch (e) { /* already gone */ }
      voiceGain = null;
    }
  }

  function playClick(hz) {
    const ac = getAudioContext();
    if (!ac) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'square';
    o.frequency.value = hz > 0 ? hz : 1100;
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.055);
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + 0.07);
    scheduled.push(o);
  }

  function toFreq(v, lo, hi) {
    if (typeof v !== 'number' || !isFinite(v)) return null;
    if (lo === hi) return midiToFreq(66);
    let t = (v - lo) / (hi - lo);
    t = Math.max(0, Math.min(1, t));
    return FMIN * Math.pow(FMAX / FMIN, t);
  }

  function playValueSweep(vals, opts) {
    const ac = getAudioContext();
    if (!ac || !Array.isArray(vals) || !vals.length) return null;
    stopValueSweep();
    const linear = !!(opts && opts.linear);
    const dur = opts && opts.duration > 0 ? opts.duration : 2.6;
    const now = ac.currentTime;
    const steps = vals.length - 1;
    const vmin = Math.min.apply(null, vals);
    const vmax = Math.max.apply(null, vals);
    const span = (vmax - vmin) || 1;
    const lmin = Math.log(Math.max(Math.abs(vmin) < 1e-9 ? 1e-9 : vmin, 1e-9));
    const lspan = (Math.log(Math.max(Math.abs(vmax) < 1e-9 ? 1e-9 : vmax, 1e-9)) - lmin) || 1;
    const ratio = FMAX / FMIN;
    function freqAt(i) {
      const v = vals[i];
      let f;
      if (linear) f = FMIN + (v - vmin) / span * (FMAX - FMIN);
      else {
        const frac = (Math.log(Math.max(v, 1e-9)) - lmin) / lspan;
        f = FMIN * Math.pow(ratio, frac);
      }
      return Math.max(FMIN, Math.min(FMAX, f));
    }
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.connect(g).connect(ac.destination);
    osc.frequency.setValueAtTime(freqAt(0), now);
    for (let i = 1; i <= steps; i++) {
      osc.frequency.linearRampToValueAtTime(freqAt(i), now + dur * i / steps);
    }
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.22, now + 0.04);
    g.gain.setValueAtTime(0.22, now + Math.max(0.05, dur - 0.12));
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.05);
    sweepOsc = osc;
    osc.onended = function () { if (sweepOsc === osc) sweepOsc = null; };
    return osc;
  }

  function stopValueSweep() {
    if (sweepOsc) {
      try { sweepOsc.stop(); } catch (e) { /* already stopped */ }
      sweepOsc = null;
    }
  }

  function stopAllAudio() {
    stopScheduled();
    stopHeldTone();
    stopVoice();
    stopValueSweep();
  }

  // Play (or retune) a held sine at freq Hz. Stops shortly after the last call,
  // so dragging the lab slider sings continuously and then decays.
  function playFreq(freq, holdMs) {
    const ac = getAudioContext();
    if (!ac || typeof freq !== 'number' || !isFinite(freq) || freq <= 0) return;
    const now = ac.currentTime;
    if (!heldOsc) {
      heldOsc = ac.createOscillator();
      heldGain = ac.createGain();
      heldOsc.type = 'sine';
      heldOsc.frequency.setValueAtTime(freq, now);
      heldGain.gain.setValueAtTime(0.0001, now);
      heldGain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
      heldOsc.connect(heldGain);
      heldGain.connect(ac.destination);
      heldOsc.start(now);
    } else {
      heldOsc.frequency.setTargetAtTime(freq, now, 0.015);
    }
    if (heldStopTimer) clearTimeout(heldStopTimer);
    const linger = holdMs == null ? 220 : holdMs;
    heldStopTimer = setTimeout(function () {
      if (heldGain && audioCtx) {
        try { heldGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.03); } catch (e) { /* closed */ }
      }
      setTimeout(stopHeldTone, 90);
    }, linger);
  }

  // Click each note in `pattern` (fractions of a whole note in 4/4) at `bpm`.
  // A quarter (0.25) is one beat, a half (0.5) is two, an eighth (0.125) is half.
  function playRhythmClicks(pattern, bpm) {
    const ac = getAudioContext();
    if (!ac || !Array.isArray(pattern) || !pattern.length) return;
    stopScheduled();
    const tempo = typeof bpm === 'number' && bpm > 0 ? bpm : 80;
    const beat = 60 / tempo;
    let t = ac.currentTime + 0.02;
    pattern.forEach(function (frac) {
      if (typeof frac !== 'number' || !isFinite(frac) || frac <= 0) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1100, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.07);
      scheduled.push(osc);
      t += frac * 4 * beat;
    });
  }

  return {
    yToFreq, midiToFreq, MIDI_LOW, MIDI_HIGH, FMIN, FMAX, toFreq,
    fractionName, formatRhythmPattern,
    getAudioContext, playFreq, playRhythmClicks, playClick,
    startVoice, setVoice, stopVoice, playValueSweep, stopValueSweep,
    stopAllAudio,
  };
});
