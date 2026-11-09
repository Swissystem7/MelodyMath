const test = require('node:test');
const assert = require('node:assert/strict');
const { lcmOf, meetingPulses, factorsOf, metersOf, isPrimeBeats, secondsPerBeat } = require('../src/lib/polyrhythm.js');

test('lcmOf returns the least common multiple for valid beat counts', () => {
  assert.strictEqual(lcmOf(3, 2), 6);
  assert.strictEqual(lcmOf(4, 6), 12);
  assert.strictEqual(lcmOf(2, 3, 4), 12);
});

test('lcmOf with a single argument returns that argument', () => {
  assert.strictEqual(lcmOf(5), 5);
});

test('lcmOf returns null with zero arguments', () => {
  assert.strictEqual(lcmOf(), null);
});

test('lcmOf returns null for zero or negative beats', () => {
  assert.strictEqual(lcmOf(0, 3), null);
  assert.strictEqual(lcmOf(-2, 3), null);
});

test('lcmOf returns null for non-integer beats', () => {
  assert.strictEqual(lcmOf(2.5, 3), null);
});

test('lcmOf returns null for beats above the 1000 maximum', () => {
  assert.strictEqual(lcmOf(1001, 2), null);
});

test('lcmOf returns null for non-numeric strings or invalid values', () => {
  assert.strictEqual(lcmOf('bad', 3), null);
  assert.strictEqual(lcmOf(NaN, 3), null);
  assert.strictEqual(lcmOf(null, 3), null);
});

test('lcmOf accepts the wholeBeats boundaries 1 and 1000', () => {
  assert.strictEqual(lcmOf(1), 1);
  assert.strictEqual(lcmOf(1000), 1000);
  assert.strictEqual(lcmOf(1, 7), 7);
});

test('meetingPulses returns pulses where both drums strike, including 0', () => {
  assert.deepStrictEqual(meetingPulses(3, 2, 12), [0, 6]);
  assert.deepStrictEqual(meetingPulses(2, 4, 8), [0, 4]);
});

test('meetingPulses returns an empty array for invalid pulses', () => {
  assert.deepStrictEqual(meetingPulses(0, 3, 12), []);
  assert.deepStrictEqual(meetingPulses(-2, 3, 12), []);
  assert.deepStrictEqual(meetingPulses(1001, 2, 12), []);
});

test('meetingPulses returns an empty array for non-integer pulses', () => {
  assert.deepStrictEqual(meetingPulses(2.5, 3, 12), []);
  assert.deepStrictEqual(meetingPulses(3, 2.5, 12), []);
});

test('meetingPulses returns an empty array for non-numeric pulses or span', () => {
  assert.deepStrictEqual(meetingPulses('bad', 3, 12), []);
  assert.deepStrictEqual(meetingPulses(3, 'bad', 12), []);
  assert.deepStrictEqual(meetingPulses(3, 2, 'bad'), []);
});

test('meetingPulses returns an empty array for invalid span', () => {
  assert.deepStrictEqual(meetingPulses(3, 2, 0), []);
  assert.deepStrictEqual(meetingPulses(3, 2, -6), []);
  assert.deepStrictEqual(meetingPulses(3, 2, 12.5), []);
});

test('secondsPerBeat returns 60/BPM rounded to 3 decimals for valid BPM', () => {
  assert.strictEqual(secondsPerBeat(120), 0.5);
  assert.strictEqual(secondsPerBeat(80), 0.75);
  assert.strictEqual(secondsPerBeat(90), 0.667);
});

test('secondsPerBeat returns null for BPM at or below zero', () => {
  assert.strictEqual(secondsPerBeat(0), null);
  assert.strictEqual(secondsPerBeat(-120), null);
});

test('secondsPerBeat returns null for non-finite BPM', () => {
  assert.strictEqual(secondsPerBeat(Infinity), null);
  assert.strictEqual(secondsPerBeat(-Infinity), null);
  assert.strictEqual(secondsPerBeat(NaN), null);
});

test('secondsPerBeat returns null for non-numeric BPM', () => {
  assert.strictEqual(secondsPerBeat('bad'), null);
  assert.strictEqual(secondsPerBeat(undefined), null);
});

test('factorsOf returns every factor of n, smallest first', () => {
  assert.deepStrictEqual(factorsOf(12), [1, 2, 3, 4, 6, 12]);
});

test('factorsOf returns an empty array for invalid or non-positive input', () => {
  assert.deepStrictEqual(factorsOf(0), []);
  assert.deepStrictEqual(factorsOf(-12), []);
  assert.deepStrictEqual(factorsOf(2.5), []);
  assert.deepStrictEqual(factorsOf(1001), []);
  assert.deepStrictEqual(factorsOf('bad'), []);
});

test('metersOf returns groupings of 2 or more beats excluding the whole bar', () => {
  assert.deepStrictEqual(metersOf(12), [2, 3, 4, 6]);
  assert.deepStrictEqual(metersOf(7), []);
});

test('metersOf returns an empty array for invalid input', () => {
  assert.deepStrictEqual(metersOf(0), []);
  assert.deepStrictEqual(metersOf('bad'), []);
});

test('isPrimeBeats is true only for prime beat counts', () => {
  assert.strictEqual(isPrimeBeats(7), true);
  assert.strictEqual(isPrimeBeats(9), false);
  assert.strictEqual(isPrimeBeats(1), false);
});

test('isPrimeBeats is false for invalid beat counts', () => {
  assert.strictEqual(isPrimeBeats(0), false);
  assert.strictEqual(isPrimeBeats('bad'), false);
});
