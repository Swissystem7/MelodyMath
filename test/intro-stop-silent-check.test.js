'use strict';
// #591 (redo of #831): intro music is cut before the exercise mounts, and the
// final עכשיו לבד check is silent. Exercise sounds still work; no audio is fine.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const PW = require('../src/lib/exercises/patternAndWorkedExample.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function el(tag) {
  return { tag, children: [], className: '', textContent: '', style: {}, innerHTML: '',
    appendChild(c) { this.children.push(c); return c; } };
}
const doc = { createElement: el };
function host() { const h = el('div'); h.ownerDocument = doc; return h; }
function find(node, cls) {
  if (String(node.className).split(' ').includes(cls)) return node;
  for (const c of node.children || []) { const f = find(c, cls); if (f) return f; }
  return null;
}
function spies() {
  const s = { taps: [], ids: [] };
  s.playTap = (voice) => s.taps.push(voice);
  s.later = (fn, ms) => { const id = setTimeout(fn, ms); s.ids.push(id); return id; };
  return s;
}
const lineOf = (re) => { const m = html.match(re); assert.ok(m, 'missing in index.html: ' + re); return m[0]; };

test('stopDemo cancels every pending demo note (behavioural)', async () => {
  const h = host(), s = spies();
  const real = globalThis.clearTimeout, cleared = [];
  PW.renderWorkedExampleWidget(h, PW.createWorkedExampleExercise({ a: 2, b: 1 }), s);
  find(h, 'demo-listen-btn').onclick();
  assert.ok(s.ids.length > 0, 'the demo schedules notes');
  globalThis.clearTimeout = (id) => { cleared.push(id); return real(id); };
  try { assert.equal(PW.stopDemo(h), s.ids.length); } finally { globalThis.clearTimeout = real; }
  assert.deepEqual(cleared, s.ids, 'each scheduled id is cleared');
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(s.taps.length, 0, 'no demo note sounds after stopDemo');
  assert.equal(PW.stopDemo(h), 0, 'second stop is a no-op');
  assert.equal(PW.stopDemo(null), 0);
});

test('הבנתי cuts the demo before the next stage paints', () => {
  const h = host(), s = spies();
  PW.renderWorkedExampleWidget(h, PW.createWorkedExampleExercise({ a: 2, b: 1 }), s);
  find(h, 'demo-listen-btn').onclick();
  find(h, 'demo-proceed-btn').onclick();
  assert.equal(h._stage, 'completion');
  assert.equal(h._timers.length, 0, 'no demo timer left waiting');
});

test('index.html: stopIntroAudio wraps rpRender and runs before f()', () => {
  assert.match(html, /function stopIntroAudio\(\)\{stopEncore\(\);/);
  const wrap = lineOf(/rpRender=function\(f\)\{return function\(\)\{stopIntroAudio\(\);return f\(\)\}\}\(rpRender\);/);
  const order = [];
  const ctx = { stopIntroAudio: () => order.push('stop'), rpRender: () => order.push('render') };
  vm.runInNewContext(wrap, ctx);
  ctx.rpRender();
  assert.deepEqual(order, ['stop', 'render']);
});

test('index.html: rpAdvance stops intro audio before mountMasteryCheck', () => {
  const adv = lineOf(/function rpAdvance\(\)\{[^\n]*/);
  const stop = adv.indexOf('stopIntroAudio()'), mount = adv.indexOf('mountMasteryCheck($(');
  assert.ok(stop > 0 && mount > 0, 'both calls present');
  assert.ok(stop < mount, 'stop runs before the mastery check mounts');
});

test('stopIntroAudio runs with no audio at all, and stops what exists', () => {
  const src = lineOf(/function stopIntroAudio\(\)\{[^\n]*/);
  const bare = { $: () => null, stopEncore() {}, rpLive: [] };
  vm.runInNewContext(src + ';stopIntroAudio()', bare); // no AudioContext, engine or widget module
  const calls = [];
  const full = { rpLive: [{ stop: () => calls.push('jam') }], stopEncore: () => calls.push('encore'),
    stopAllAudio: () => calls.push('all'), musicEngine: { stopAll: () => calls.push('engine') },
    $: () => ({}), MM_PATTERN_WORKED: { stopDemo: () => calls.push('demo') } };
  vm.runInNewContext(src + ';stopIntroAudio()', full);
  assert.deepEqual(calls, ['encore', 'jam', 'all', 'engine', 'demo']);
  assert.equal(full.rpLive.length, 0);
});

test('a streak phrase still sounding is cut by stopIntroAudio', () => {
  const src = lineOf(/function trackStreakPhrases\(\)\{[^\n]*/) + ';' + lineOf(/function stopIntroAudio\(\)\{[^\n]*/);
  const cut = [], dest = { real: true }, bus = { connect: () => {}, disconnect: () => cut.push('bus') };
  const ac = { destination: dest, createGain: () => bus };
  let heard = null;
  const ctx = { Proxy, rpLive: [], $: () => null, stopEncore() {}, getSharedAudioContext: () => ac,
    MM_MASTERY_STREAK: { playPhrase: (p, i, a) => { heard = a.destination; return { started: true }; } } };
  vm.runInNewContext(src + ';trackStreakPhrases();MM_MASTERY_STREAK.playPhrase({notes:[440]},null,null,0.3)', ctx);
  assert.equal(heard, bus, 'the phrase plays into its own bus, not straight to the speakers');
  assert.equal(ctx.rpLive.length, 1);
  vm.runInNewContext('stopIntroAudio()', ctx);
  assert.deepEqual(cut, ['bus'], 'the bus is cut before the next exercise mounts');
  assert.equal(ctx.rpLive.length, 0);
});

test('noMusic worked example opens at עכשיו לבד, silent, plays nothing', async () => {
  const h = host(), s = spies();
  PW.renderWorkedExampleWidget(h, Object.assign(PW.createWorkedExampleExercise({ a: 3, b: 2 }), { noMusic: true }), s);
  assert.equal(h._stage, 'independent');
  assert.equal(h._silent, true);
  assert.equal(find(h, 'demo-listen-btn'), null);
  await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual([s.taps.length, s.ids.length], [0, 0], 'no audio function called');
});

test('noMusic pattern widget: no listen button and choices stay silent', () => {
  const h = host(), s = spies(); let answered = null;
  const ex = Object.assign(PW.createPatternCompletionExercise({}), { noMusic: true });
  PW.renderPatternWidget(h, ex, Object.assign(s, { onAnswer: (c) => { answered = c; } }));
  assert.equal(find(h, 'demo-listen-btn'), null);
  find(h, 'pattern-choices').children.forEach((b) => b.onclick());
  assert.equal(s.taps.length, 0);
  assert.equal(answered, 'מי', 'the check still works without music');
});

test('index.html: setMusicWay returns early on a noMusic round', () => {
  const fn = lineOf(/function setMusicWay\(id,it\)\{[^\n]*/);
  assert.match(fn, /if\(it&&it\.noMusic\)\{el\.innerHTML='';show\(id,false\);return\}/);
  assert.ok(fn.indexOf('it.noMusic') < fn.indexOf('mountFreePad'));
});

test('a normal item still has its listen button and plays the demo', async () => {
  const h = host(), s = spies();
  PW.renderPatternWidget(h, PW.createPatternCompletionExercise({}), s);
  find(h, 'demo-listen-btn').onclick();
  await new Promise((r) => setTimeout(r, 1500));
  assert.equal(s.taps.length, 3, 'דו➔מי➔דו is heard');
  find(h, 'pattern-choices').children[0].onclick();
  assert.equal(s.taps.length, 4, 'a choice tap sounds');
});

test('no playTap / AudioContext available: widgets render and do not throw', () => {
  const saved = globalThis.playTap; delete globalThis.playTap;
  try {
    const h = host();
    PW.renderWorkedExampleWidget(h, PW.createWorkedExampleExercise({ a: 1, b: 1 }), { later: () => 1 });
    assert.doesNotThrow(() => find(h, 'demo-listen-btn').onclick());
    find(h, 'demo-proceed-btn').onclick();
    assert.doesNotThrow(() => find(h, 'completion-tap-btn').onclick());
    assert.equal(h._stage, 'independent');
    const p = host();
    PW.renderPatternWidget(p, PW.createPatternCompletionExercise({}), {});
    assert.doesNotThrow(() => find(p, 'pattern-choices').children[1].onclick());
  } finally { if (saved !== undefined) globalThis.playTap = saved; }
});
