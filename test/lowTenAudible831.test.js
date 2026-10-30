const test = require('node:test');
const assert = require('node:assert/strict');
const g1 = require('../src/lib/grade1Music');
const iv = require('../src/lib/instrumentVoices');

test('chart100Sound plays the tens at 220 Hz or above, not near 110 (#831)', () => {
  for (let n = 13; n <= 99; n++) {
    const hz = g1.chart100Sound(n).tensFreq;
    assert.ok(hz >= 220, n + ' -> ' + hz);
  }
  assert.equal(g1.chart100Sound(13).tensFreq, 220);
});

function passes(filter, hz) {
  if (!filter) return true;
  if (filter.type === 'lowpass') return filter.hz > hz;
  if (filter.type === 'highpass') return filter.hz < hz;
  return filter.hz / hz <= 2 && hz / filter.hz <= 2; // bandpass: centre within an octave
}

test('drumHigh and woodClick let a held 220 Hz ten through (#831)', () => {
  ['drumHigh', 'woodClick'].forEach((v) => {
    assert.ok(passes(iv.planVoice(v, 220).filter, 220), v);
  });
});

test('no AudioContext (muted/blocked): plan and events still work, playVoice returns null', () => {
  assert.equal(iv.playVoice(null, 'drumHigh', 220), null);
  assert.equal(iv.playVoice(undefined, 'woodClick', 220, 0, null, { dur: 1 }), null);
  assert.equal(iv.planVoice('noSuchVoice', 220), null);
  const ev = g1.chart100Events(13);
  assert.equal(ev.length, 4);
  assert.equal(ev[0].hz, 220);
  assert.ok(ev.every((e) => Number.isFinite(e.at) && Number.isFinite(e.hz)));
});

test('other voices and normal drumHigh/woodClick pitches keep their filter', () => {
  assert.deepEqual(iv.planVoice('drumHigh', 330).filter, { type: 'bandpass', hz: 2500 });
  assert.deepEqual(iv.planVoice('drumHigh', 261.63).filter, { type: 'bandpass', hz: 2500 });
  assert.deepEqual(iv.planVoice('woodClick', 261.63).filter, { type: 'bandpass', hz: 2200 });
  assert.deepEqual(iv.planVoice('drumHigh').filter, { type: 'bandpass', hz: 2500 });
  assert.deepEqual(iv.planVoice('woodClick', 2000).filter, { type: 'bandpass', hz: 2200 });
  assert.deepEqual(iv.planVoice('woodClick', 1800).filter, { type: 'bandpass', hz: 2200 });
  assert.deepEqual(iv.planVoice('drumLow', 220).filter, { type: 'lowpass', hz: 900 });
  assert.deepEqual(iv.planVoice('breathy', 220).filter, { type: 'bandpass', hz: 1800 });
});
