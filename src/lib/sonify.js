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

  function yToFreq(y, yMin, yMax) {
    if (typeof y !== 'number' || !isFinite(y)) return null;
    // A flat function has no range to map onto; answer with the middle pitch
    // rather than dividing by zero.
    if (yMin === yMax) return midiToFreq(66);
    const clamped = Math.min(Math.max(y, yMin), yMax);
    const t = (clamped - yMin) / (yMax - yMin);
    return midiToFreq(MIDI_LOW + t * (MIDI_HIGH - MIDI_LOW));
  }

  return { yToFreq, midiToFreq, MIDI_LOW, MIDI_HIGH };
});
