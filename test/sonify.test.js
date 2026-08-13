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

test('rhythm fractions print as 1/4+1/2+1/8, not raw decimals', () => {
  const { fractionName, formatRhythmPattern } = require('../src/lib/sonify');
  assert.equal(fractionName(0.25), '1/4');
  assert.equal(fractionName(0.5), '1/2');
  assert.equal(fractionName(0.125), '1/8');
  assert.equal(fractionName(1 / 3), '1/3');
  assert.equal(formatRhythmPattern([0.25, 0.5, 0.125]), '1/4+1/2+1/8');
  // the old String(n) lookup used keys '.25' / '.5' and never matched
  assert.notEqual(String(0.25), '.25');
  assert.equal(formatRhythmPattern([.25, .5, .125, .375]), '1/4+1/2+1/8+3/8');
});

test('toFreq shares the C3–C6 range with yToFreq at the endpoints', () => {
  const { toFreq, yToFreq, FMIN, FMAX } = require('../src/lib/sonify');
  assert.ok(Math.abs(toFreq(0, 0, 1) - FMIN) < 1e-6);
  assert.ok(Math.abs(toFreq(1, 0, 1) - FMAX) < 1e-6);
  assert.equal(toFreq(NaN, 0, 1), null);
  assert.ok(yToFreq(0, 0, 100) > 0);
});

test('audio helpers are inert in Node — no AudioContext, no throw', () => {
  const { getAudioContext, playFreq, playRhythmClicks, playClick, playCountClicks, playValueSweep, stopAllAudio } = require('../src/lib/sonify');
  assert.equal(getAudioContext(), null);
  assert.doesNotThrow(() => playFreq(440));
  assert.doesNotThrow(() => playRhythmClicks([0.25, 0.5, 0.125], 80));
  assert.doesNotThrow(() => playClick(1400));
  assert.doesNotThrow(() => playCountClicks([3, 2], 76));
  assert.doesNotThrow(() => playValueSweep([1, 2, 4], { linear: false }));
  assert.doesNotThrow(() => stopAllAudio());
});
