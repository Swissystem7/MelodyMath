// #591 goal A.2: every tap on a musical element = sound + press/bounce/glow
// + navigator.vibrate(10) where supported; right and wrong sound different.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ENGINE = require.resolve('../src/lib/musicEngine');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function freshEngine() {
  delete require.cache[ENGINE];
  return require(ENGINE);
}

function fakeAudioWindow() {
  function Param() {}
  ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime'].forEach((k) => { Param.prototype[k] = function () {}; });
  const node = () => ({ frequency: new Param(), gain: new Param(), connect(x) { return x || this; }, start() {}, stop() {} });
  function AC() { this.state = 'running'; this.currentTime = 1; this.destination = {}; }
  AC.prototype.createOscillator = node;
  AC.prototype.createGain = node;
  AC.prototype.createBufferSource = node;
  AC.prototype.createBuffer = () => ({ getChannelData: () => new Float32Array(4) });
  return { AudioContext: AC };
}

function fakeEl(attrs) {
  const classes = new Set();
  return {
    attrs, offsetWidth: 40,
    getAttribute(k) { return k in attrs ? attrs[k] : null; },
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), has: (c) => classes.has(c) },
    closest(sel) { return sel === '[data-tap]' && 'data-tap' in attrs ? this : null; },
  };
}

function withEnv(fn) {
  const nav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const buzz = [];
  Object.defineProperty(globalThis, 'navigator', { value: { vibrate: (ms) => buzz.push(ms) }, configurable: true, writable: true });
  global.window = fakeAudioWindow();
  const M = freshEngine();
  try { return fn(M, buzz); } finally {
    delete global.window;
    if (nav) Object.defineProperty(globalThis, 'navigator', nav); else delete globalThis.navigator;
    freshEngine();
  }
}

test('a tap sounds, glows and buzzes 10 ms', () => withEnv((M, buzz) => {
  const el = fakeEl({ 'data-tap': 'xylo', 'data-hz': '392' });
  const r = M.tapFeedback(el, { timeStamp: 50 });
  assert.ok(r, 'it played');
  assert.equal(M.audioState.lastVoice, 'xylo');
  assert.equal(M.audioState.lastEventTime, 50);
  assert.ok(el.classList.has('mm-tap'), 'press/bounce/glow class');
  assert.deepEqual(buzz, [10]);
}));

test('the bar keeps its own pitch through data-hz', () => {
  const M = freshEngine();
  assert.equal(M.tapPlan('xylo', 0, 392)[0].hz, 392);
  assert.equal(M.tapPlan('xylo', 0, 99999)[0].hz, M.HZ_MAX, 'still clamped to the safe band');
});

test('disabled or untagged elements stay silent', () => withEnv((M, buzz) => {
  assert.equal(M.tapFeedback(fakeEl({}), {}), null);
  const off = fakeEl({ 'data-tap': 'kick' });
  off.disabled = true;
  assert.equal(M.tapFeedback(off, {}), null);
  assert.deepEqual(buzz, []);
}));

test('one delegated pointerdown per finger; keyboard clicks sound too, mouse clicks do not twice', () => withEnv((M) => {
  const on = {};
  const doc = { addEventListener(type, fn) { on[type] = fn; } };
  assert.equal(M.installTapFeedback(doc), true);
  const a = fakeEl({ 'data-tap': 'bell', 'data-step': '1' });
  const b = fakeEl({ 'data-tap': 'bell', 'data-step': '4' });
  on.pointerdown({ target: a, timeStamp: 5, pointerId: 1 });
  on.pointerdown({ target: b, timeStamp: 6, pointerId: 2 });
  assert.equal(M.audioState.taps, 2, 'two fingers, two notes');
  on.click({ target: a, detail: 1 });
  assert.equal(M.audioState.taps, 2, 'the click after a pointerdown does not sound again');
  on.click({ target: a, detail: 0 });
  assert.equal(M.audioState.taps, 3, 'Enter/Space sounds');
  assert.equal(M.installTapFeedback(null), typeof document !== 'undefined');
}));

test('index.html wires the feedback in and respects reduced motion', () => {
  assert.match(html, /installTapFeedback\(document\)/);
  assert.match(html, /\.mm-tap\{animation:mmTap/);
  assert.match(html, /prefers-reduced-motion:reduce\)\{\.mm-tap\{animation:none!important/);
  assert.match(html, /\[data-tap\]\{touch-action:none/, 'no pinch-zoom on instruments, so two fingers make two notes');
  assert.match(html, /class="xylo-key"[^>]*data-tap="xylo"/);
  assert.match(html, /btn\.dataset\.tap=dp\.sound/);
  assert.match(html, /btn\.onpointerdown=/);
  assert.match(html, /if\(!correct && typeof playTap==='function'\) playTap\('wrong'\)/);
});
