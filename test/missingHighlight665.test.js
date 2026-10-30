'use strict';
// #665 req 4 — after a partial answer, highlight (and echo) only the missing part.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const NP = require('../src/components/NumberPlay.js');
const { isCorrect } = require('../src/lib/adaptive');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const plan32 = () => NP.extractNumberPlan({ prompt: '3 + 2 = ?', grade: 'א' }, { bpm: 60 });
const missingDots = (h) => [...h.matchAll(/class="np-dot[^"]*np-missing[^"]*"[^>]*data-i="(\d+)"/g)].map((m) => +m[1]);

test('3 + 2 answered 4: exactly the last circle is marked missing', () => {
  const plan = plan32();
  const missing = NP.missingIndexes(plan, '4');
  assert.deepEqual(missing, [4]);
  assert.deepEqual(missingDots(NP.renderHtml(plan, { missing })), [4]);
  assert.deepEqual(missingDots(NP.renderHtml(plan)), [], 'no highlight without opts');
});

test('missingCue: no overlapping sounds, one echo per missing note after the exercise', () => {
  const plan = plan32();
  const cue = NP.missingCue(plan, '2');
  const miss = NP.missingIndexes(plan, '2');
  for (let i = 1; i < cue.length; i++) {
    assert.ok(cue[i].at > cue[i - 1].at, 'strictly increasing at ' + i);
    assert.ok(cue[i].at - cue[i - 1].at >= plan.beat - 1e-9, 'gap >= beat at ' + i);
  }
  const extra = cue.slice(plan.notes.length);
  assert.equal(extra.length, miss.length);
  assert.ok(extra.every((n) => n.missing === true && n.at >= plan.duration));
  assert.ok(cue.slice(0, plan.notes.length).every((n) => !n.missing));
});

test('13 + 2 missing the ten echoes one ten-note, not ten unit beats', () => {
  const plan = NP.extractNumberPlan({ prompt: '13 + 2 = ?' }, { bpm: 60 });
  const tenIdx = plan.notes.findIndex((n) => n.value === 10);
  assert.ok(tenIdx >= 0);
  // The ten is played first, so "missing" is the running total past the answer: for 0 the ten is missing.
  const miss = NP.missingIndexes(plan, '0');
  assert.ok(miss.includes(tenIdx));
  assert.deepEqual(NP.missingIndexes(plan, '5'), [], '5 falls inside the ten: no half-ten highlight');
  assert.deepEqual(NP.missingIndexes(plan, '10'), [1, 2, 3, 4, 5]);
  const extra = NP.missingCue(plan, '0').filter((n) => n.missing);
  assert.equal(extra.length, miss.length);
  assert.equal(extra.filter((n) => n.value === 10).length, 1, 'one ten-note');
  assert.ok(extra.length <= 12, 'never ten unit beats for the ten');
  assert.equal(extra.reduce((s, n) => s + n.value, 0), plan.totalValue - (miss[0] ? plan.notes.slice(0, miss[0]).reduce((s, n) => s + n.value, 0) : 0));
  assert.deepEqual(NP.missingIndexes(plan, '14'), [plan.notes.length - 1], '14: only the last unit');
  assert.ok(plan.notes.length <= 12 && plan.notes.filter((n) => n.value === 1).length === 5);
});

test('no highlight for correct, over, non-numeric, subtraction or noMusic', () => {
  const plan = plan32();
  ['5', '6', '12', 'x', '', null].forEach((g) => assert.deepEqual(NP.missingIndexes(plan, g), [], String(g)));
  assert.deepEqual(NP.missingCue(plan, '5'), []);
  const sub = NP.extractNumberPlan({ prompt: '7 - 3 = ?' });
  assert.deepEqual(NP.missingIndexes(sub, '2'), []);
  assert.deepEqual(NP.missingIndexes(null, '2'), []);
  assert.equal(NP.extractNumberPlan({ noMusic: true, prompt: 'כמה?' }), null);
  assert.equal(NP.renderHtml(null, { missing: [0] }), '');
});

test('a missing tail longer than 12 notes is not echoed (no long runs of unit beats)', () => {
  const plan = NP.extractNumberPlan({ prompt: '12 + 8 = ?' });
  assert.equal(plan.notes.length, 20);
  assert.deepEqual(NP.missingIndexes(plan, '7'), [], '13 missing -> nothing');
  assert.deepEqual(NP.missingCue(plan, '7'), []);
  assert.equal(NP.missingIndexes(plan, '8').length, 12);
});

test('a plan with groups keeps at least two instrument families', () => {
  const plan = plan32();
  assert.ok(new Set(plan.groups.map((g) => g.family)).size >= 2);
  assert.ok(new Set(plan.groups.map((g) => g.voice)).size >= 2);
});

function fakeContainer() {
  const dots = [];
  const c = { classList: { add() {}, remove() {} }, live: { textContent: '' } };
  Object.defineProperty(c, 'innerHTML', { set(h) { dots.length = 0; (h.match(/class="np-dot/g) || []).forEach(() => { const s = new Set(); dots.push({ cls: s, classList: { add: (k) => s.add(k), remove: (k) => s.delete(k) } }); }); }, get() { return ''; } });
  c.querySelector = (q) => (q === '.np-live' ? c.live : { addEventListener() {} });
  c.querySelectorAll = () => dots;
  c.dots = dots;
  return c;
}

test('mounted showMissing marks circles, plays only when not quiet, works with no audio kit', (t) => {
  const played = [];
  globalThis.MM_JAM = { playNotes: (notes) => { played.push(notes); return { stop() {} }; } };
  t.after(() => { delete globalThis.MM_JAM; });
  const el = fakeContainer();
  const h = NP.mount(el, { prompt: '3 + 2 = ?', grade: 'א' }, { bpm: 60 });
  assert.equal(h.showMissing('4', { quiet: true }), false, 'no expected answer -> no highlight');
  assert.equal(h.showMissing('4', { quiet: true, answer: 6 }), false, 'answer must match the strip');
  assert.equal(el.dots.filter((d) => d.cls.has('np-missing')).length, 0);
  assert.equal(h.showMissing('4', { quiet: true, answer: 5 }), true);
  assert.deepEqual(el.dots.map((d) => d.cls.has('np-missing')), [false, false, false, false, true]);
  assert.equal(played.length, 0, 'muted: no sound');
  assert.match(el.live.textContent, /1/);
  assert.equal(h.showMissing('5', { answer: 5 }), false);
  assert.equal(h.showMissing('4', { answer: '5' }), true);
  assert.equal(played.length, 1);
  assert.equal(played[0].filter((n) => n.missing).length, 1);
  globalThis.MM_JAM = {}; // audio unavailable: still highlights, no crash
  assert.equal(h.showMissing('3', { answer: 5 }), true);
  assert.equal(el.dots.filter((d) => d.cls.has('np-missing')).length, 2);
});

function runCheck(item, answer, showMissing) {
  const els = {}; const calls = { show: [], hear: 0 };
  const ctx = { answered: false, current: item, history: [], setTimeout() {}, show() {}, normalizeAnswer: (v) => String(v).trim(), isCorrect, noteMetro() {}, logTeacherItem() {}, mathHtml: (s) => s, maybeSpeak() {}, prefsNow: () => ({ quiet: false }), maybeHear: () => { calls.hear++; },
    $: (id) => els[id] || (els[id] = { value: '', style: {}, focus() {} }) };
  calls.stops = 0; calls.openStops = 0;
  ctx.stopItemMusic = () => { calls.openStops++; };
  ctx.$('practiceNumberPlay')._np = { showMissing: (g, o) => { calls.show.push([g, o]); return showMissing; }, stop: () => { calls.stops++; } };
  ctx.$('answer').value = answer;
  vm.createContext(ctx);
  vm.runInContext(html.match(/^function check\(.*$/m)[0] + ';check()', ctx);
  return { ctx, calls };
}

test('check(): first partial miss highlights instead of replaying, child stays on the item', () => {
  const { ctx, calls } = runCheck({ prompt: '3 + 2 = ?', answer: 5 }, '4', true);
  assert.deepEqual(calls.show.map((c) => c[0]), ['4']);
  assert.equal(calls.show[0][1].quiet, false);
  assert.equal(calls.show[0][1].answer, 5, 'expected answer is passed to the strip');
  assert.equal(calls.openStops, 1, 'the opening sound is stopped before the cue');
  assert.equal(calls.stops, 0);
  assert.equal(calls.hear, 0);
  assert.equal(ctx.answered, false);
  assert.equal(ctx.history.length, 0);
  const fallback = runCheck({ prompt: '3 + 2 = ?', answer: 5 }, 'x', false);
  assert.equal(fallback.calls.hear, 1, 'nothing to highlight -> replay as before');
  const silent = runCheck({ prompt: '3 + 2 = ?', answer: 5, noMusic: true }, '4', true);
  assert.equal(silent.calls.show.length, 0);
  assert.equal(silent.calls.hear, 0);
  assert.equal(silent.ctx.answered, true);
  assert.equal(silent.calls.stops, 1, 'final answer stops the strip cue before result sounds');
});

test('setNumberPlay stops the previous strip before replacing it', () => {
  const body = html.match(/function setNumberPlay\(id,it\)\{.*\}/)[0];
  let stopped = 0, n = 0;
  const slot = { innerHTML: '', classList: { add() {}, remove() {} } };
  const set = new Function('$', 'MM_NUMBER_PLAY', 'selectedGrade', 'metroStreak', 'who', body + '\nreturn setNumberPlay;')(
    () => slot, { mount: () => ({ id: ++n, stop: () => { stopped++; } }) }, 'א', 0, null);
  set('practiceNumberPlay', { prompt: '3 + 2 = ?' });
  assert.equal(slot._np.id, 1);
  set('practiceNumberPlay', { prompt: '4 + 1 = ?' });
  assert.equal(stopped, 1);
  assert.equal(slot._np.id, 2);
  set('practiceNumberPlay', { noMusic: true });
  assert.equal(stopped, 2);
  assert.equal(slot._np, null);
});
