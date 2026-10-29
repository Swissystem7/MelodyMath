'use strict';
// #665 requirement 3: a general drag exercise type. The child drags pieces into
// a box (finger, mouse or keyboard), each landed piece sounds, and the box
// fills the answer field of the real practice screen.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DP = require('../src/lib/music/dragPlace');
const JAM = require('../src/components/jamKit');
const banks = require('../src/lib/banks');
const core = require('../src/lib/core');

const shipped = banks.allItems();
const byPrompt = (p) => { const it = shipped.find((i) => i.prompt === p); assert.ok(it, 'shipped: ' + p); return it; };
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

test('build: place-value pieces, read from the shipped prompt', () => {
  const s = DP.specForItem(byPrompt('200 + 30 + 4 = ?'));
  assert.deepEqual(s, { kind: 'build', target: 234, pieces: ['hundred', 'ten', 'one'] });
  assert.equal(DP.specForItem(byPrompt('כתבו את המספר שיש בו 3 מאות, 0 עשרות ו־8 יחידות.')).target, 308);
  assert.equal(DP.specForItem(byPrompt('500 + 6 = ?')).target, 506);
  const k = shipped.find((i) => /^5 אלפים/.test(i.prompt));
  assert.deepEqual(DP.specForItem(k).pieces, ['thousand', 'hundred', 'ten', 'one']);
  assert.equal(DP.specForItem(k).target, 5064);
  assert.deepEqual(DP.specForItem(byPrompt('20 + 60 = ?')), { kind: 'build', target: 80, pieces: ['ten', 'one'] });
  assert.equal(DP.specForItem(byPrompt('5 + 4 = ?')), null, 'small addition keeps its own way');
  assert.equal(DP.specForItem(byPrompt('34 + 25 = ?')), null, 'not round parts');
});

test('pick: the two whole numbers of a place-value comparison', () => {
  const s = DP.specForItem(byPrompt('איזה מספר גדול יותר: 342 או 423?'));
  assert.equal(s.kind, 'pick');
  assert.equal(s.bigger, true);
  assert.deepEqual(s.options.map((o) => o.value), [342, 423]);
  assert.equal(DP.specForItem(byPrompt('איזה מספר קטן יותר: 605 או 560?')).bigger, false);
  const big = DP.specForItem(shipped.find((i) => /254,129/.test(i.prompt)));
  assert.deepEqual(big.options.map((o) => o.label), ['254,129', '245,929']);
  assert.equal(DP.boxValue(big, [0]), '254129', 'the answer field gets it without commas');
  assert.equal(DP.specForItem(byPrompt('איזה שבר גדול יותר: 3/8 או 5/8? כתבו את השבר.')), null, 'fractions keep their own way');
  assert.equal(DP.specForItem(byPrompt('מה גדול יותר, 0.09 או 0.1? כתבו את הגדול.')), null);
  assert.equal(DP.specForItem(shipped.find((i) => /חצי מ־20 תפוחים/.test(i.prompt))), null);
});

test('every shipped item that gets the drag can be answered by dragging', () => {
  const hit = shipped.filter((i) => DP.specForItem(i));
  assert.ok(hit.length >= 20, 'reaches real topics: ' + hit.length);
  assert.ok(new Set(hit.map((i) => i.grade)).size >= 3, 'in several grades');
  hit.forEach((it) => {
    const s = DP.specForItem(it);
    let box;
    if (s.kind === 'pick') box = [s.options.findIndex((o) => String(o.value) === String(it.answer))];
    else {
      box = [];
      let left = s.target;
      DP.PLACES.forEach((p) => { while (left >= p.v && s.pieces.includes(p.kind)) { box.push(p.kind); left -= p.v; } });
      assert.ok(box.length <= DP.MAX_IN, it.prompt);
    }
    assert.ok(core.isCorrect(DP.boxValue(s, box), it.answer), it.prompt);
  });
  assert.equal(DP.specForItem({ ...byPrompt('500 + 6 = ?'), noMusic: true }), null, 'the end-of-topic check stays plain');
  const own = shipped.find((i) => i.widget === 'g2' && /איזה מספר/.test(i.prompt));
  assert.ok(own);
  assert.equal(DP.specForItem(own), null, 'an item with its own widget keeps it');
});

test('sound: one note per landed piece on the child instrument, bigger place lower, never the ukulele', () => {
  const s = DP.specForItem(byPrompt('200 + 30 + 4 = ?'));
  assert.ok(DP.noteFor(s, 'hundred').hz < DP.noteFor(s, 'ten').hz && DP.noteFor(s, 'ten').hz < DP.noteFor(s, 'one').hz);
  const p = DP.specForItem(byPrompt('איזה מספר גדול יותר: 342 או 423?'));
  assert.ok(DP.noteFor(p, 1).hz > DP.noteFor(p, 0).hz, 'the bigger number sounds higher');
  const MY = require('../src/lib/myInstrument');
  const INST = require('../src/lib/instruments');
  const dj = mem(); MY.setMyInstrument('djembe', dj);
  const calls = [];
  const ac = { currentTime: 3, state: 'running', resume() {} };
  const pv = (c, v, hz, t) => calls.push({ v, hz, t });
  assert.equal(DP.sound(s, 'one', { audioContext: ac, storage: dj, playVoice: pv }).instrument, 'djembe');
  const r = DP.sound(s, 'ten', { audioContext: ac, storage: dj, playVoice: pv });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].v, INST.instrumentById('djembe').voice, 'ones on the child instrument');
  assert.equal(calls[1].v, INST.instrumentById('koto').voice, 'bigger places on another family');
  assert.equal(r.hz, DP.noteFor(s, 'ten').hz);
  calls.length = 1;
  const uke = mem(); MY.setMyInstrument('ukulele', uke);
  assert.equal(DP.voiceFor(uke), INST.instrumentById('xylophone').voice);
  assert.equal(DP.sound(s, 'ten', { quiet: true, audioContext: ac, playVoice: () => calls.push(1) }), null);
  assert.equal(calls.length, 1, 'quiet makes no sound');
});

// A small fake page: the host, its pieces and the box, enough for mount().
function fakePage() {
  const handlers = {};
  const el = (cls, attrs) => ({
    className: cls, attrs: attrs || {}, disabled: false,
    classList: { contains: (c) => cls.split(' ').includes(c) },
    getAttribute(k) { return this.attrs[k]; },
    closest(sel) { return sel.split(',').some((s) => cls.split(' ').includes(s.trim().slice(1))) ? this : null; },
    setPointerCapture() {},
  });
  const box = el('dp-box');
  const ghosts = [];
  const doc = {
    body: { appendChild: (g) => ghosts.push(g) },
    createElement: () => ({ style: {}, remove() { this.removed = true; }, addEventListener: (t, f) => { (handlers[t] = handlers[t] || []).push(f); } }),
    elementFromPoint: (x) => (x >= 100 ? box : el('floor')),
  };
  const host = { kids: [], appendChild(k) { this.kids.push(k); } };
  const fire = (type, target, x) => (handlers[type] || []).forEach((f) => f({ type, target, clientX: x, clientY: 0, pointerId: 1 }));
  return { el, doc, host, ghosts, fire };
}

test('mount: drag with a finger, tap, and take out; the box fills the answer field', () => {
  const p = fakePage();
  const saved = globalThis.document;
  globalThis.document = p.doc;
  globalThis.MM_JAM = JAM;
  try {
    const answers = [];
    const spec = DP.mount(p.host, byPrompt('200 + 30 + 4 = ?'), { fill: (v) => answers.push(v), quiet: true });
    assert.equal(spec.target, 234);
    const view = p.host.kids[0];
    assert.match(view.innerHTML, /class="dp-box"/);
    assert.equal((view.innerHTML.match(/class="dp-piece /g) || []).length, 3);
    const hundred = p.el('dp-piece dp-hundred', { 'data-dp': 'hundred' });
    p.fire('pointerdown', hundred, 0); p.fire('pointermove', hundred, 60); p.fire('pointerup', hundred, 150);
    assert.deepEqual(answers, ['100'], 'a drop on the box adds the piece');
    assert.equal(p.ghosts.length, 1);
    assert.match(p.ghosts[0].className, /dp-ghost +dp-hundred/, 'the ghost has the piece colour');
    p.fire('click', hundred, 150);
    assert.deepEqual(answers, ['100'], 'the click that ends a drag is not a second piece');
    p.fire('pointerdown', hundred, 0); p.fire('pointermove', hundred, 60); p.fire('pointerup', hundred, 20);
    assert.equal(answers.length, 1, 'dropped beside the box: nothing');
    const ten = p.el('dp-piece dp-ten', { 'data-dp': 'ten' });
    p.fire('pointerdown', ten, 0); p.fire('pointerup', ten, 0); p.fire('click', ten, 0);
    assert.deepEqual(answers.slice(-1), ['110'], 'a tap (or Enter) adds the piece without dragging');
    assert.match(view.innerHTML, /data-dp-at="1"/);
    assert.match(view.innerHTML, /1 מאות, 1 עשרות, 0 יחידות/);
    p.fire('click', p.el('dp-in dp-hundred', { 'data-dp-at': '0' }), 0);
    assert.deepEqual(answers.slice(-1), ['10'], 'a piece in the box is taken out by a tap');
  } finally {
    globalThis.document = saved;
    delete globalThis.MM_JAM;
  }
});

test('index.html shows the drag in the practice screen, and the pieces drag on touch', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /<script src="src\/lib\/music\/dragPlace\.js"><\/script>/);
  assert.match(html, /MM_DRAG_PLACE\.mount\(host, item, \{fill:fill/);
  const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'jam.css'), 'utf8');
  assert.match(css, /\.dp-piece\{touch-action:none/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/dragPlace\.js'/);
});

test('at least 2 instrument families: ones and bigger places never share a family', () => {
  const INST = require('../src/lib/instruments');
  const MY = require('../src/lib/myInstrument');
  const d = DP.voicesFor(mem());
  assert.notEqual(INST.instrumentById(d.one.id).family, INST.instrumentById(d.big.id).family);
  INST.INSTRUMENTS.forEach((x) => {
    const st = mem(); MY.setMyInstrument(x.id, st);
    const v = DP.voicesFor(st);
    assert.notEqual(INST.instrumentById(v.one.id).family, INST.instrumentById(v.big.id).family, x.id);
  });
  const s = DP.specForItem(byPrompt('200 + 30 + 4 = ?')), ac = { currentTime: 0, state: 'running' }, pv = () => {};
  assert.notEqual(DP.sound(s, 'one', { audioContext: ac, playVoice: pv }).voice, DP.sound(s, 'ten', { audioContext: ac, playVoice: pv }).voice);
});

// The real renderWidget of index.html, with the earlier music branches loaded,
// on real mm-cur-13 (grade ב place value) items.
const topic13 = require('../src/lib/curriculum').itemsForTopic('mm-cur-13', shipped);
const byId = (id) => { const it = topic13.find((i) => i.id === id); assert.ok(it, id); return it; };
function screen(t, prefs) {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const src = html.match(/function renderWidget\(hostId, item, inputId\)\{[\s\S]*?\n\}/)[0];
  const p = fakePage(), input = { value: '' }, played = [];
  p.host.classList = { names: ['hidden'], add(c) { if (!this.names.includes(c)) this.names.push(c); }, remove(c) { this.names = this.names.filter((n) => n !== c); } };
  const saved = { document: globalThis.document, playVoice: globalThis.playVoice, getSharedAudioContext: globalThis.getSharedAudioContext };
  globalThis.document = p.doc;
  globalThis.playVoice = (c, v) => played.push(v);
  globalThis.getSharedAudioContext = () => ({ currentTime: 0, state: 'running' });
  t.after(() => Object.assign(globalThis, saved));
  const ctx = { $: (id) => (id === 'ans' ? input : p.host), prefsNow: () => prefs || {}, MM_DRAG_PLACE: DP,
    MM_TAKEAWAY_TEN: require('../src/lib/music/takeAwayTen.js'), MM_PERCENT_MIX: require('../src/lib/music/percentMix.js'),
    MM_PATTERN_WORKED: require('../src/lib/exercises/patternAndWorkedExample.js'), MM_TAP_TEMPO_MEAN: require('../src/lib/exercises/tapTempoMean.js') };
  vm.createContext(ctx);
  const rw = vm.runInContext(src + '\nrenderWidget;', ctx);
  const tap = (dp) => p.fire('click', p.el('dp-piece', { 'data-dp': String(dp) }), 0);
  return { p, input, played, render: (item) => rw('widgetHost', item, 'ans'), tap };
}

test('dragPlace renders in the practice screen', (t) => {
  const s = screen(t);
  s.render(byId('ב-place_value-290'));
  assert.deepEqual(s.p.host.classList.names, [], 'the host is shown');
  assert.match(s.p.host.kids[0].innerHTML, /class="dp-box"/);
});

test('a correct drop is accepted by the screen answer check', (t) => {
  const s = screen(t);
  const build = byId('ב-place_value-290');
  s.render(build);
  ['hundred', 'hundred', 'ten', 'ten', 'ten', 'one', 'one', 'one', 'one'].forEach(s.tap);
  assert.equal(core.isCorrect(s.input.value, build.answer), true);
  assert.ok(new Set(s.played).size >= 2, 'two voices sound: ' + s.played);
  s.tap('one');
  assert.equal(core.isCorrect(s.input.value, build.answer), false, 'a wrong total fails');
});

test('a wrong drop is rejected: the smaller number when the bigger is asked', (t) => {
  const q = screen(t), pick = byId('ב-place_value-294');
  q.render(pick);
  q.tap(0);
  assert.equal(core.isCorrect(q.input.value, pick.answer), false, 'the smaller number when the bigger is asked');
  q.tap(1);
  assert.equal(core.isCorrect(q.input.value, pick.answer), true);
  assert.equal(new Set(q.played).size, 1, 'both numbers on one instrument, so the timbre does not tell the answer');
});

test('no music: quiet stays silent and still fills the answer', (t) => {
  const s = screen(t, { quiet: true });
  const pick = byId('ב-place_value-294');
  s.render(pick);
  s.tap(1);
  assert.deepEqual(s.played, []);
  assert.equal(core.isCorrect(s.input.value, pick.answer), true);
});
