'use strict';
// Subtraction as a difference, not only take-away (docs/research/topics/005):
// "how many from 8 to 13?" is heard as the 8 you have, then counting UP.
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../src/lib/music/takeAwayTen');
const banks = require('../src/lib/banks');

const it = { music: 'takeAwayBeats', prompt: 'כמה חסר מ־8 עד 13?', answer: 5 };

test('counting up: one chord for where you stand, then one rising step per unit added', () => {
  const s = T.specForItem(it);
  assert.equal(s.kind, 'countUp');
  assert.deepEqual([s.start, s.target, s.added], [8, 13, 5]);
  const ev = T.soundEvents(s);
  const stand = ev.filter((e) => e.phase === 'stand');
  assert.equal(new Set(stand.map((e) => e.at)).size, 1, 'the start is one moment, not eight beats');
  assert.equal(stand.length, 2, 'a chord, so the place is not a count');
  const up = ev.filter((e) => e.phase === 'up');
  assert.equal(up.length, 5, 'the steps counted up are the answer');
  assert.ok(up[0].at - stand[0].at > 0.5, 'a breath between where you stand and the steps up');
  assert.equal(T.answerText(s), 'חסרים 5');
  const before = T.circlesHtml(s);
  assert.equal((before.match(/snd-stand/g) || []).length, 1);
  assert.equal((before.match(/snd-beat/g) || []).length, 0, 'eight drums would be counted too');
});

test('the steps added are the answer, so they appear only after it', () => {
  const s = T.specForItem(it);
  const before = T.circlesHtml(s), after = T.circlesHtml(s, { revealed: true });
  assert.equal((before.match(/snd-add/g) || []).length, 0);
  assert.equal((after.match(/snd-add/g) || []).length, 5);
});

test('the steps are heard rising, and the first step is higher than the chord', () => {
  const s = T.specForItem(it);
  const calls = [];
  const ac = { currentTime: 0, state: 'running' };
  T.play(s, { audioContext: ac, playVoice: (ctx, voice, hz, when) => calls.push({ hz: hz, when: when }) });
  const ups = calls.filter((c, i) => i >= 2);
  assert.equal(ups.length, 5);
  const chordTop = Math.max(calls[0].hz, calls[1].hz);
  // Render each scheduled note as the sine playVoice would start at that
  // frequency, and read the pitch back from the samples.
  function heardHz(hz) {
    const sr = 8000, n = Math.floor(0.12 * sr);
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) x[i] = Math.sin(2 * Math.PI * hz * i / sr);
    let bestF = 0, bestM = 0;
    for (let f = 300; f <= 1600; f += 2) {
      let re = 0, im = 0;
      const w = 2 * Math.PI * f / sr;
      for (let i = 0; i < n; i += 2) { re += x[i] * Math.cos(w * i); im -= x[i] * Math.sin(w * i); }
      const m = re * re + im * im;
      if (m > bestM) { bestM = m; bestF = f; }
    }
    return bestF;
  }
  const heard = calls.map((c) => heardHz(c.hz));
  const heardChord = Math.max(heard[0], heard[1]);
  const heardSteps = heard.slice(2);
  assert.ok(heardSteps[0] > heardChord, 'the first step is above the chord (' + heardSteps[0] + ' vs ' + heardChord + ')');
  for (let i = 1; i < heardSteps.length; i++) {
    assert.ok(heardSteps[i] > heardSteps[i - 1], 'step ' + i + ' rises (' + heardSteps[i - 1] + ' → ' + heardSteps[i] + ')');
  }
  assert.ok(chordTop > 0);
});

test('"מה ההפרש" counts up from the smaller number; it is not take-away', () => {
  const bank = banks.allItems().find((x) => x.prompt === 'מה ההפרש בין 13 ל־7?');
  assert.equal(bank.music, 'takeAwayBeats');
  const s = T.specForItem(bank);
  assert.equal(s.kind, 'countUp');
  assert.deepEqual([s.start, s.target, s.added], [7, 13, 6]);
  const ev = T.soundEvents(s);
  assert.equal(ev.filter((e) => e.phase === 'up').length, 6);
  assert.equal(ev.filter((e) => e.phase === 'start').length, 0, 'not "take 7 from 13"');
  assert.equal(T.specForItem(Object.assign({}, bank, { answer: 13 })), null);
});

test('a wrong key is never set to sound, and the bank item plays', () => {
  assert.equal(T.specForItem(Object.assign({}, it, { answer: 21 })), null);
  const bank = banks.allItems().find((x) => x.prompt === 'כמה חסר מ־8 עד 13?');
  assert.equal(T.specForItem(bank).added, 5);
  assert.equal(T.specForItem({ music: 'takeAwayBeats', prompt: 'כמה חסר מ־13 עד 8?', answer: 5 }), null, 'never downward');
});
