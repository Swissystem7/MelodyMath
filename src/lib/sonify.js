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

  function stopAllAudio() {
    stopScheduled();
    stopHeldTone();
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
    yToFreq, midiToFreq, MIDI_LOW, MIDI_HIGH,
    fractionName, formatRhythmPattern,
    getAudioContext, playFreq, playRhythmClicks, stopAllAudio,
  };
});
