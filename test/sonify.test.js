const test = require('node:test');
const assert = require('node:assert/strict');
const { yToFreq, midiToFreq, MIDI_LOW, MIDI_HIGH } = require('../src/lib/sonify');

test('the bottom of the range sounds the lowest note', () => {
  assert.equal(yToFreq(0, 0, 100), midiToFreq(MIDI_LOW));
});

test('the top of the range sounds the highest note', () => {
  assert.equal(yToFreq(100, 0, 100), midiToFreq(MIDI_HIGH));
});

test('pitch rises monotonically with y', () => {
  let previous = -Infinity;
  for (let y = 0; y <= 100; y += 5) {
    const freq = yToFreq(y, 0, 100);
    assert.ok(freq > previous, `y=${y} did not raise the pitch`);
    previous = freq;
  }
});

test('values outside the range are clamped, not extrapolated', () => {
  assert.equal(yToFreq(-500, 0, 100), yToFreq(0, 0, 100));
  assert.equal(yToFreq(500, 0, 100), yToFreq(100, 0, 100));
});

test('a flat function still produces a pitch instead of dividing by zero', () => {
  const freq = yToFreq(7, 7, 7);
  assert.ok(Number.isFinite(freq) && freq > 0);
});

test('the mapping is relative to the given range, not to absolute y', () => {
  assert.equal(yToFreq(50, 0, 100), yToFreq(0, -50, 50));
});

test('non-numeric input returns null rather than NaN', () => {
  for (const bad of ['5', null, undefined, NaN, Infinity, {}]) {
    assert.equal(yToFreq(bad, 0, 100), null, `expected null for ${String(bad)}`);
  }
});

test('the three-octave span is exactly two doublings of frequency', () => {
  const low = yToFreq(0, 0, 100);
  const high = yToFreq(100, 0, 100);
  assert.ok(Math.abs(high / low - 8) < 1e-9, 'C3 to C6 should be a factor of 8');
});

test('audio helpers are inert in Node — no AudioContext, no throw', () => {
  const { getAudioContext, playFreq, playRhythmClicks, stopAllAudio } = require('../src/lib/sonify');
  assert.equal(getAudioContext(), null);
  assert.doesNotThrow(() => playFreq(440));
  assert.doesNotThrow(() => playRhythmClicks([0.25, 0.5, 0.125], 80));
  assert.doesNotThrow(() => stopAllAudio());
});
