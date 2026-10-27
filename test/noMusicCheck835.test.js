// MelodyMath — no-music path for PR #835 (Refs #835): audio unavailable must not crash or make sound.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const PW = require('../src/lib/exercises/patternAndWorkedExample.js');

const INDEX = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fnLine = (name) => INDEX.match(new RegExp('^function ' + name + '\\(.*$', 'm'))[0];
function box() {
  const node = () => { const n = { style: {}, className: '', textContent: '', hidden: false, children: [] }; n.appendChild = (c) => (n.children.push(c), c); Object.defineProperty(n, 'innerHTML', { get: () => '', set: () => n.children.splice(0) }); return n; };
  const host = node(); host.ownerDocument = { createElement: node }; return host;
}
function find(n, cls) {
  if (n.className && n.className.split(' ').includes(cls)) return n;
  for (const c of n.children || []) { const h = find(c, cls); if (h) return h; }
  return null;
}

test('#835 no-music: worked example runs demo → completion → independent with audio unavailable', (t) => {
  const saved = { playTap: globalThis.playTap, AudioContext: globalThis.AudioContext, speechSynthesis: globalThis.speechSynthesis };
  t.after(() => Object.assign(globalThis, saved));
  Object.assign(globalThis, { playTap: undefined, AudioContext: undefined, speechSynthesis: undefined });
  const host = box();
  const ex = PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'demo' });
  assert.doesNotThrow(() => {
    PW.renderWorkedExampleWidget(host, ex, { later: (fn) => fn() });
    find(host, 'demo-listen-btn').onclick();
    find(host, 'demo-proceed-btn').onclick();
    find(host, 'completion-tap-btn').onclick();
  });
  assert.equal(host._stage, 'independent');
  assert.equal(host._silent, true);
  // Audio becomes available later: the independent stage still must not touch it.
  const calls = [];
  globalThis.playTap = () => calls.push('root.playTap');
  globalThis.AudioContext = function () { calls.push('new AudioContext'); };
  const spied = box();
  PW.renderWorkedExampleWidget(spied, ex, { playTap: () => calls.push('opts.playTap'), later: (fn) => fn() });
  find(spied, 'demo-proceed-btn').onclick();
  find(spied, 'completion-tap-btn').onclick();
  calls.length = 0;
  for (const h of [host, spied]) for (let i = 0; i < 7; i++) assert.doesNotThrow(() => h._retry());
  assert.deepEqual(calls, [], 'zero audio calls on the independent stage');
  assert.equal(/\d/.test(find(host, 'mm-ex-hint').textContent), false);
});

function ctxFor(item) {
  const calls = [], els = {};
  const el = (id) => els[id] || (els[id] = { id, value: '', disabled: false, className: '', textContent: '', innerHTML: '', hidden: true, focus() {}, style: {} });
  const spy = (name) => function () { calls.push(name); };
  const ctx = {
    MM_PATTERN_WORKED: PW, $: el, PLAN_PER_SKILL: 5, current: item, history: [], answered: false,
    show: (id, on) => { el(id).hidden = !on; }, normalizeAnswer: (v) => String(v).trim(), askForAnswer: spy('askForAnswer'),
    answerOk: (it, v) => String(v).trim() === String(it.answer), isCorrect: (v, a) => String(v).trim() === String(a),
    mathHtml: (s) => String(s), nextLevel: (lv) => lv, logTeacherItem() {}, answerHint: (it) => it.hint, musicSourceHtml: () => '', revealWidget() {},
    noteMetro: spy('noteMetro'), maybeHear: spy('maybeHear'), maybeSpeak: spy('maybeSpeak'), playTap: spy('playTap'), playLevelTune: spy('playLevelTune'),
    setTimeout: (fn) => fn(), finish() {},
  };
  vm.createContext(ctx);
  vm.runInContext('var rpAnswered=false,rpHoldStreak=false,rpStep=0,mmHush=false,mmHushWas=false;' + ['hushAudio', 'stayOnWrong', 'rpCheck', 'check'].map(fnLine).join('\n'), ctx);
  ctx.rmPlan = [{ he: 'דגמים', current: item, history: [] }];
  return { ctx, el, calls };
}

test('#835 rpCheck: a wrong pattern_completion answer stays on the item, silent and spoiler-free', () => {
  const item = PW.createPatternCompletionExercise();
  const { ctx, el, calls } = ctxFor(item);
  el('rmPlanAnswer').value = 'סול';
  ctx.rpCheck();
  assert.equal(vm.runInContext('rpAnswered', ctx), false);
  assert.equal(ctx.rmPlan[0].history.length, 0);
  assert.equal(el('rmPlanNext').hidden, true);
  assert.equal(/התשובה/.test(el('rmPlanFeedback').innerHTML), false, el('rmPlanFeedback').innerHTML);
  assert.match(el('rmPlanFeedback').innerHTML, /אחרי דו בא מי/);
  assert.equal(el('rmPlanAnswer').value, '');
  assert.equal(el('rmPlanAnswer').disabled, false);
  assert.deepEqual(calls, [], 'no maybeHear/maybeSpeak/playTap on a wrong pattern answer');
});

test('#835 practice check(): a wrong worked_example answer keeps answered=false and history empty', () => {
  const item = PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'independent' });
  const { ctx, el, calls } = ctxFor(item);
  el('answer').value = '4';
  ctx.check();
  assert.equal(vm.runInContext('answered', ctx), false);
  assert.equal(ctx.history.length, 0);
  assert.equal(/התשובה|5/.test(el('feedback').innerHTML), false, el('feedback').innerHTML);
  assert.equal(el('feedback').innerHTML.includes(item.hint), false);
  assert.ok(el('feedback').innerHTML.includes(PW.retryHint(item)), 'no widget here, so the hint div stays');
  assert.equal(el('answer').value, '');
  assert.equal(el('answer').disabled, false);
  assert.equal(el('check').disabled, false);
  assert.deepEqual(calls, [], 'no maybeHear/maybeSpeak on the retry');
  el('answer').value = '5';
  ctx.check();
  assert.equal(vm.runInContext('answered', ctx), true);
  assert.equal(ctx.history.length, 1);
  assert.equal(ctx.history[0].correct, false, 'a correct answer after a miss is not counted as correct');
});
