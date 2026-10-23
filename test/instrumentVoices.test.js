'use strict';
// #591 goal B: every instrument timbre is synthesised with WebAudio, so no
// audio file ships and SOUNDS-LICENSES.md has nothing third-party to list.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const V = require('../src/lib/instrumentVoices');

test('every voice plans gentle oscillators with a finite envelope', () => {
  const ids = Object.keys(V.VOICES);
  assert.ok(ids.length >= 10);
  ids.forEach((id) => {
    const p = V.planVoice(id);
    assert.ok(p.oscillators.length >= 1, id);
    const sum = p.oscillators.reduce((s, o) => s + o.gain, 0) + p.noise;
    assert.ok(sum > 0 && sum <= V.MAX_GAIN + 1e-9, id + ' gain ' + sum);
    p.oscillators.forEach((o) => {
      assert.ok(['sine', 'square', 'sawtooth', 'triangle'].includes(o.type), id);
      assert.ok(o.hz >= 20 && o.hz <= 20000 && o.endHz > 0, id);
    });
    assert.ok(p.attack > 0 && p.attack < 0.2, id);
    assert.ok(p.decay > 0 && p.decay <= 3, id);
  });
});

test('planVoice follows the requested pitch and rejects unknown voices', () => {
  assert.equal(V.planVoice('keys', 440).oscillators[0].hz, 440);
  assert.equal(V.planVoice('keys', -1).oscillators[0].hz, V.VOICES.keys.hz);
  assert.equal(V.planVoice('nope'), null);
});

test('drums fall in pitch, sustained voices do not', () => {
  const d = V.planVoice('drumLow').oscillators[0];
  assert.ok(d.endHz < d.hz);
  const k = V.planVoice('organ').oscillators[0];
  assert.equal(k.endHz, k.hz);
});

test('playVoice is inert without an AudioContext (Node)', () => {
  assert.equal(V.playVoice(null, 'keys', 440), null);
});

test('playVoice renders every voice on a stub AudioContext and stops it', () => {
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const started = [];
  const node = () => ({ gain: param(), frequency: param(), connect(n) { return n; },
    start(t) { started.push(t); }, stop(t) { assert.ok(t > 0); } });
  const ac = { currentTime: 1, sampleRate: 8000, destination: {},
    createGain: node, createOscillator: node, createBiquadFilter: node, createBufferSource: node,
    createBuffer: (c, len, sr) => ({ sampleRate: sr, getChannelData: () => new Float32Array(len) }) };
  Object.keys(V.VOICES).forEach((id) => {
    const end = V.playVoice(ac, id, 0);
    assert.ok(end > 1 && end < 5, id);
  });
  assert.ok(started.every((t) => t === 1));
});

test('SOUNDS-LICENSES.md exists and states no third-party audio is used', () => {
  const md = fs.readFileSync(path.join(__dirname, '..', 'SOUNDS-LICENSES.md'), 'utf8');
  assert.match(md, /no third-party audio/i);
  Object.keys(V.VOICES).forEach((id) => assert.ok(md.includes('`' + id + '`'), id + ' listed'));
  const audio = [];
  (function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
      if (e.name === 'node_modules' || e.name.startsWith('.')) return;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(wav|mp3|ogg|flac|m4a|aac|opus)$/i.test(e.name)) audio.push(path.relative(path.join(__dirname, '..'), p));
    });
  })(path.join(__dirname, '..'));
  audio.forEach((f) => assert.ok(md.includes(f), f + ' must be listed with its licence'));
});
