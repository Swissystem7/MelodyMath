'use strict';
// Refs #831: the touched paths still work with audio muted, blocked or missing.
const test = require('node:test');
const assert = require('node:assert/strict');
const mod = require('../src/lib/music/takeAwayTen');
const g2 = require('../src/lib/grade2Music');
const store = require('../src/lib/teacherStore');

test('takeAway play with no AudioContext, no engine, or a blocked engine: null, no throw', () => {
  assert.equal(typeof globalThis.AudioContext, 'undefined');
  const spec = mod.takeAwayCircles(34, 10);
  assert.equal(mod.play(spec, {}), null);
  assert.equal(mod.play(spec, { audioContext: null, playVoice: () => { throw new Error('no ctx'); } }), null);
  assert.equal(mod.play(spec, { playSequence: () => null }), null); // muted / autoplay-blocked
  const ac = { currentTime: 0, state: 'suspended', resume() { throw new Error('autoplay'); } };
  const r = mod.play(spec, { audioContext: ac, playVoice: () => {} });
  assert.ok(r && r.notes > 0, 'a rejected resume() does not throw');
});

test('grade2Music events and makeChoices need no audio at all', () => {
  assert.ok(g2.cubeLayerEvents(34).length > 0);
  const s = g2.verticalVoices({ a: 47, b: 38, op: '+' });
  assert.ok(g2.phaseEvents(s.phases).length > 0);
  assert.equal(store.makeChoices('5/2', () => 0.5).length, 4);
  assert.equal(store.makeChoices('7', () => 0.5).length, 4);
});
