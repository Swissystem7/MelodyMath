'use strict';
// ShofarCalls: the calls of the shofar as multiplication and the distributive
// law. A call is one unit — שברים and תרועה are one call each, however many
// blasts they have. Thirty calls: 3 × 4 + 3 × 3 + 3 × 3 = 3 × (4 + 3 + 3).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const S = require('../src/lib/music/shofarCalls');
const banks = require('../src/lib/banks');

const item = (prompt, answer) => ({ kind: 'shofar', prompt: prompt, answer: answer });
const spec = (...a) => S.specForItem(item(...a));
const ev = (...a) => S.soundEvents(spec(...a));
const calls = (list) => list.filter((n) => n.call && n.worth === 1);
const worth = (list) => list.reduce((s, n) => s + (n.worth || 0), 0);
const TSRT = 'תשר״ת הם ארבעה קולות: תקיעה, שברים, תרועה, תקיעה. תוקעים אותם 3 פעמים. כמה קולות?';

test('a call is one unit: שברים are three blasts but one call, תרועה many blasts but one call', () => {
  const e = ev(TSRT, 12);
  assert.equal(calls(e).length, 12);
  assert.deepEqual(calls(e).slice(0, 4).map((n) => n.call), ['T', 'S', 'R', 'T']);
  assert.equal(e.filter((n) => n.call === 'S').length, 9, 'three blasts in each of three שברים');
  assert.equal(e.filter((n) => n.call === 'R').length, 27);
  assert.ok(e.every((n) => n.voice === 'horn'));
  assert.equal(spec('תש״ת הם שלושה קולות: תקיעה, שברים, תקיעה. תוקעים אותם 3 פעמים. כמה קולות?', 9).value, 9);
});

test('3 × 4 + 3 × 3 + 3 × 3: each sequence once in full, then a bell for each repeat — worth 30', () => {
  const e = ev('קולות השופר: 3 × 4 + 3 × 3 + 3 × 3 = ?', 30);
  assert.equal(calls(e).length, 10);
  assert.deepEqual(e.filter((n) => n.stage === 'again').map((n) => n.worth), [4, 4, 3, 3, 3, 3]);
  assert.equal(worth(e), 30);
});

test('3 × (4 + 3 + 3): the round of ten once, then two bells worth a round — the same thirty calls in another order', () => {
  const e = ev('3 × 4 + 3 × 3 + 3 × 3 = 3 × ☐', 10);
  assert.equal(calls(e).length, 10, 'one round is ten calls');
  assert.deepEqual(e.filter((n) => n.stage === 'roundAgain').map((n) => n.worth), [10, 10]);
  assert.equal(worth(e), 30, 'the same thirty as 3 × 4 + 3 × 3 + 3 × 3');
});

test('only when the calls give exactly the answer, and only items marked as shofar', () => {
  assert.equal(spec(TSRT, 13), null, 'a wrong key is never set to sound');
  assert.equal(spec('3 × 4 + 3 × 3 + 3 × 3 = 3 × ☐', 30), null);
  assert.equal(S.specForItem({ prompt: TSRT, answer: 12 }), null, 'not marked as shofar');
  assert.equal(S.specForItem(null), null);
});

test('the bank: the shofar items of grades 3–4 are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => S.specForItem(it));
  assert.equal(list.length, 4);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['ג', 'ד']);
  list.forEach((it) => {
    const s = S.specForItem(it), h = S.html(s);
    assert.ok(!(h.match(/\d+/g) || []).includes(String(it.answer)), 'leak: ' + it.prompt);
    assert.ok(S.longestRun(S.soundEvents(s)) <= S.MAX_RUN, 'run: ' + it.prompt);
    assert.match(S.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec(TSRT, 12);
  const calls2 = [];
  const env = { playVoice: (ac, voice, hz, when) => calls2.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = S.soundEvents(s).length;
  assert.deepEqual(S.play(s, env), { notes: n });
  assert.ok(calls2.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(S.play(s, {}), { notes: n, silent: true });
  assert.equal(S.play(null, env), null);
  assert.equal(S.html(null), '');
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_SHOFAR_CALLS\.play\(sc\)/);
  assert.match(html, /host\._shofarSpec && typeof MM_SHOFAR_CALLS!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/shofarCalls\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/shofarCalls\.js'/);
});
