'use strict';
// LawsSix: operations as stages in the right order, relations from a known
// result, the distributive law as two layers, fractions as beats of a bar.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const L = require('../src/lib/music/lawsSix');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const spec = (...a) => L.specForItem(item(...a));
const ev = (...a) => L.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);
const worthOf = (list, n) => list.filter((e) => e.stage === 'result' && e.n === n).reduce((s, e) => s + e.worth, 0);

test('stages: brackets first, then ×, then − — each stage ends with its result', () => {
  const e = ev('groupsFirstLongChain', '120 − 8 × (20 − 15) = ?', 80);
  assert.deepEqual(stage(e, 'sign').map((n) => n.op), ['bracket', 'times', 'take']);
  assert.deepEqual([0, 1, 2].map((n) => worthOf(e, n)), [5, 40, 80]);
});

test('× and : of equal rank go left to right', () => {
  const e = ev('groupsFirstLongChain', '(45 + 15) : 6 × 2 = ?', 20);
  assert.deepEqual(stage(e, 'sign').map((n) => n.op), ['bracket', 'share', 'times']);
  assert.deepEqual([0, 1, 2].map((n) => worthOf(e, n)), [60, 10, 20]);
});

test('relations: the known result, then only the change and what it does', () => {
  const half = ev('groupsFirstLongChain', '24 × 36 = 864. כמה זה 12 × 36?', 432);
  assert.equal(stage(half, 'known').reduce((s, n) => s + n.worth, 0), 864);
  assert.equal(stage(half, 'sign')[0].op, 'halve');
  assert.equal(stage(half, 'changed').reduce((s, n) => s + n.worth, 0), 432);
  assert.equal(stage(ev('groupsFirstLongChain', '4,312 : 7 = 616. כמה זה 43,120 : 7? (כתבו בלי פסיק)', 6160), 'sign')[0].op, 'tenfold');
  assert.equal(spec('groupsFirstLongChain', '4,312 : 7 = 616. כמה זה 4,312 : 14?', 308).change, 'half');
});

test('the distributive law: two layers apart, then together', () => {
  const e = ev('groupsFirstLongChain', 'חבילת אריחים עולה 234 ש״ח. רעות קנתה 12 חבילות, כל אחת יקרה ב־5 ש״ח. כמה שילמה? (כתבו בלי פסיק)', 2868);
  const sum = (st) => stage(e, st).reduce((s, n) => s + n.worth, 0);
  assert.equal(sum('layerA'), 2808);
  assert.equal(sum('layerB'), 60);
  assert.equal(sum('together'), 2868);
  assert.equal(Math.round(stage(ev('bracketBeatsFirst', '3.6 × 99 + 3.6 = ?', 360), 'together').reduce((s, n) => s + n.worth, 0)), 360);
});

test('fractions as beats of a 4-beat bar: with and without brackets', () => {
  const plain = ev('barFill', '1/2 + 1/2 × 1/2 = ?', '3/4');
  assert.deepEqual(stage(plain, 'sign').map((n) => n.op), ['times', 'join']);
  assert.equal(plain.filter((n) => n.stage === 'barBeats').length, 1 + 3);
  const br = ev('barFill', '(1/2 + 1/2) × 1/2 = ?', '1/2');
  assert.equal(stage(br, 'sign')[0].op, 'bracket');
});

test('a number and its reciprocal: a phrase and its exact undoing', () => {
  const e = ev('reciprocalNotes', '3/4 × 5 × 4/3 = ?', 5);
  assert.equal(stage(e, 'whole').length, 5);
  assert.equal(stage(e, 'wholeAgain').length, 5);
  assert.equal(stage(e, 'taken').length, 3);
  assert.equal(stage(e, 'restored').length, 4);
  const r = ev('barFill', 'מהו המספר ההופכי ל־2/5? (כשבר)', '5/2');
  assert.equal(stage(r, 'part').length, 4);
  assert.equal(stage(r, 'halfPart').length, 1);
});

test('undoing to find the box: walk back stage by stage', () => {
  const s = spec('bracketBeatsFirst', 'השלימו: (☐ − 0.4) : 7 = 1', 7.4);
  assert.equal(s.undo, true);
  const e = L.soundEvents(s);
  assert.equal(Math.round(e.filter((n) => n.stage === 'result' && n.n === 1).reduce((a, n) => a + n.worth, 0) * 10), 74);
});

test('only when the sounds give exactly the answer', () => {
  assert.equal(spec('groupsFirstLongChain', '120 − 8 × (20 − 15) = ?', 100), null, 'a wrong key is never set to sound');
  assert.equal(spec('nextBeat', '120 − 8 × (20 − 15) = ?', 80), null);
  assert.equal(L.specForItem(null), null);
});

test('the bank: grade 6 order-of-operations and laws items are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => L.specForItem(it));
  assert.ok(list.length >= 18, 'played ' + list.length);
  list.forEach((it) => {
    const s = L.specForItem(it), h = L.html(s), a = String(it.answer);
    assert.ok(!(h.match(/[\d./]+/g) || []).includes(a), 'leak: ' + it.prompt);
    assert.ok(L.longestRun(L.soundEvents(s)) <= L.MAX_RUN, 'run: ' + it.prompt);
    assert.match(L.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('reciprocalNotes', 'חילוק ב־1/3 שווה לכפל באיזה מספר?', 3);
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  assert.deepEqual(L.play(s, env), { notes: 4 });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(L.play(s, {}), { notes: 4, silent: true });
  assert.equal(L.play(null, env), null);
  assert.equal(L.html(null), '');
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_LAWS_SIX\.play\(l6\)/);
  assert.match(html, /host\._lawsSpec && typeof MM_LAWS_SIX!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/lawsSix\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/lawsSix\.js'/);
});
