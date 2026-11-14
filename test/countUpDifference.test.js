'use strict';
// Subtraction as a difference, not only take-away (docs/research/topics/005):
// "how many from 8 to 13?" is heard as the 8 you have, then counting UP.
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../src/lib/music/takeAwayTen');
const banks = require('../src/lib/banks');

const it = { music: 'takeAwayBeats', prompt: 'כמה חסר מ־8 עד 13?', answer: 5 };

test('counting up: the start as one group, then one rising step per unit added', () => {
  const s = T.specForItem(it);
  assert.equal(s.kind, 'countUp');
  assert.deepEqual([s.start, s.target, s.added], [8, 13, 5]);
  const ev = T.soundEvents(s);
  assert.equal(ev.filter((e) => e.phase === 'start').length, 8);
  const up = ev.filter((e) => e.phase === 'up');
  assert.equal(up.length, 5, 'the steps counted up are the answer');
  assert.ok(up[0].at - ev.filter((e) => e.phase === 'start').pop().at > 0.5, 'a breath between where you stand and the steps up');
  assert.equal(T.answerText(s), 'חסרים 5');
});

test('the steps added are the answer, so they appear only after it', () => {
  const s = T.specForItem(it);
  const before = T.circlesHtml(s), after = T.circlesHtml(s, { revealed: true });
  assert.equal((before.match(/snd-add/g) || []).length, 0);
  assert.equal((after.match(/snd-add/g) || []).length, 5);
});

test('a wrong key is never set to sound, and the bank item plays', () => {
  assert.equal(T.specForItem(Object.assign({}, it, { answer: 21 })), null);
  const bank = banks.allItems().find((x) => x.prompt === 'כמה חסר מ־8 עד 13?');
  assert.equal(T.specForItem(bank).added, 5);
  assert.equal(T.specForItem({ music: 'takeAwayBeats', prompt: 'כמה חסר מ־13 עד 8?', answer: 5 }), null, 'never downward');
});
