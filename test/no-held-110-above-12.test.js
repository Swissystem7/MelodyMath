'use strict';
// Refs #831: above 12 a ten is a held sound, and a held 110 Hz tone is a
// silent drone on a phone speaker. No held/long note may sit at <= 110 Hz.
const test = require('node:test');
const assert = require('node:assert/strict');
const mod = require('../src/lib/music/takeAwayTen');
const g2 = require('../src/lib/grade2Music');

function memory() {
  const m = Object.create(null);
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } };
}
function playCalls(spec) {
  const calls = [];
  const ac = { currentTime: 0, state: 'running', resume() {} };
  mod.play(spec, { audioContext: ac, storage: memory(), playVoice: (c, v, hz, t, dest, opts) => calls.push({ hz: hz, dur: opts && opts.dur, held: !!opts }) });
  return calls;
}
function noLowHeld(events, label) {
  events.forEach((e) => {
    if (e.held || e.dur > 0) assert.ok(e.hz > 110, label + ': held note at ' + e.hz + ' Hz');
  });
}

test('takeAway above 12: no held ten at 110 Hz, for several take values', () => {
  for (let start = 13; start <= 99; start++) {
    for (const take of [0, 1, 5, 10, Math.floor(start / 2), start]) {
      const spec = mod.takeAwayCircles(start, take);
      assert.ok(spec, start + '-' + take);
      const calls = playCalls(spec);
      assert.ok(calls.length, 'sound for ' + start + '-' + take);
      noLowHeld(calls, 'takeAway ' + start + '-' + take);
      assert.ok(calls.some((c) => c.held), 'a ten is still held at ' + start);
    }
  }
});

test('takeAway 12 and below is unchanged: plain short notes, nothing held', () => {
  for (let start = 1; start <= 12; start++) {
    const spec = mod.takeAwayCircles(start, Math.floor(start / 2));
    const events = mod.soundEvents(spec);
    const calls = playCalls(spec);
    assert.equal(calls.length, events.length);
    assert.ok(calls.every((c) => !c.held), 'nothing held at ' + start);
    calls.forEach((c, i) => assert.equal(c.hz, events[i].hz));
  }
});

test('cube layers 13..100: the ten is not a 110 Hz drone; 12 stays units', () => {
  for (let n = 13; n <= 100; n++) noLowHeld(g2.cubeLayerEvents(n), 'cubeLayer ' + n);
  const twelve = g2.cubeLayerEvents(12);
  assert.equal(twelve.length, 12);
  assert.ok(twelve.every((e) => e.place === 'unit' && e.hz === 220));
});

test('carry/borrow phases for two-digit columns hold no note at <= 110 Hz', () => {
  let regroups = 0;
  for (let a = 10; a <= 99; a++) {
    for (let b = 1; b <= 99; b += 7) {
      ['+', '-'].forEach((op) => {
        const s = g2.verticalVoices({ a: a, b: b, op: op });
        if (!s) return;
        if (s.regroup) regroups++;
        noLowHeld(g2.phaseEvents(s.phases), a + op + b);
      });
    }
  }
  assert.ok(regroups > 100, 'carry and borrow cases were covered');
  const reg = g2.registerVoices({ h: 4, t: 12, o: 3 });
  noLowHeld(g2.phaseEvents(reg.phases), 'registers 4/12/3');
  // The tens voice is still the lowest voice of each set.
  assert.ok(g2.VOICES.bass.hz < g2.VOICES.drum.hz);
  assert.ok(g2.REG_VOICES.bass.hz < g2.REG_VOICES.piano.hz);
});
