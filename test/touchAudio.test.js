// #591 goal A: a tap must start its sound at once (under 50 ms), every voice
// is synthesised, and window.audioState tells the e2e test when it started.
const test = require('node:test');
const assert = require('node:assert/strict');

const ENGINE = require.resolve('../src/lib/musicEngine');
function freshEngine() {
  delete require.cache[ENGINE];
  return require(ENGINE);
}

function fakeWindow() {
  const made = [];
  function Param() { this.calls = []; }
  ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime']
    .forEach((k) => { Param.prototype[k] = function (v, t) { this.calls.push([k, v, t]); }; });
  function node(kind, ac) {
    const n = { kind, frequency: new Param(), gain: new Param(), starts: [], connect(x) { return x || this; }, disconnect() {}, start(t) { this.starts.push(t); }, stop() {} };
    ac.nodes.push(n);
    return n;
  }
  function AC(opts) { made.push(this); this.opts = opts; this.state = 'suspended'; this.currentTime = 7; this.sampleRate = 8000; this.destination = {}; this.nodes = []; this.buffers = 0; }
  AC.prototype.resume = function () { this.state = 'running'; return Promise.resolve(); };
  AC.prototype.createOscillator = function () { return node('osc', this); };
  AC.prototype.createGain = function () { return node('gain', this); };
  AC.prototype.createBufferSource = function () { return node('buffer', this); };
  AC.prototype.createBuffer = function (ch, len) { this.buffers++; const d = new Float32Array(len); return { getChannelData: () => d }; };
  return { AudioContext: AC, made };
}

function withWindow(fn) {
  const win = fakeWindow();
  global.window = win;
  const M = freshEngine();
  win.getSharedAudioContext = M.getSharedAudioContext;
  try { return fn(M, win); } finally { delete global.window; freshEngine(); }
}

test('tapPlan: pitched voices climb a pentatonic ladder, unknown voices are silent', () => {
  const M = freshEngine();
  assert.deepEqual(M.tapPlan('kazoo'), []);
  const low = M.tapPlan('xylo', 0);
  const high = M.tapPlan('xylo', 99);
  assert.equal(low[0].hz, 261.63);
  assert.equal(high[0].hz, 659.25, 'step is clamped to the top bar');
  assert.ok(Math.abs(low[1].hz - 261.63 * 2.76) < 1e-9, 'the bar has its bright partial');
  Object.keys(M.TAP_VOICES).forEach((v) => {
    M.tapPlan(v, 3).forEach((p) => {
      assert.ok(p.gain > 0 && p.gain <= M.MAX_GAIN, v + ' stays at or under the safe gain');
      assert.ok(p.dur > 0 && p.dur < 1, v + ' is short');
      assert.equal(p.at < 0.2, true, v + ' starts at once');
    });
  });
});

test('correct and wrong feedback are distinct and gentle', () => {
  const M = freshEngine();
  const right = M.tapPlan('correct');
  const wrong = M.tapPlan('wrong');
  assert.notDeepEqual(right.map((p) => p.hz), wrong.map((p) => p.hz));
  assert.ok(right[1].hz > right[0].hz, 'right rises');
  assert.ok(wrong[1].hz < wrong[0].hz, 'wrong falls');
  assert.ok(Math.max(...wrong.map((p) => p.gain)) < Math.max(...right.map((p) => p.gain)), 'wrong is the quieter one');
  wrong.forEach((p) => assert.equal(p.type, 'sine', 'no square-wave buzzer for a mistake'));
});

test('the tap half is inert in Node and audioState says idle', () => {
  const M = freshEngine();
  assert.equal(M.playTap('xylo', { step: 2 }), null);
  assert.equal(M.audioState(), 'idle');
  assert.equal(M.audioState.lastStart, null);
  assert.equal(M.musicEngine, M, 'the engine is reachable under one stable name');
  assert.equal(M.canReplay(), false);
  assert.deepEqual(M.replaySequence(), []);
});

test('playTap starts on currentTime with no lookahead and records when', () => withWindow((M, win) => {
  assert.equal(M.audioState(), 'idle', 'no context before the first tap');
  const r = M.playTap('xylo', { step: 1, eventTime: 12.5 });
  const ac = win.made[0];
  assert.equal(win.made.length, 1);
  assert.equal(ac.opts.latencyHint, 'interactive');
  assert.equal(r.startTime, ac.currentTime, 'no scheduling lookahead on a tap');
  const srcs = ac.nodes.filter((n) => n.kind === 'osc');
  assert.equal(srcs.length, 2);
  srcs.forEach((n) => assert.equal(n.starts[0], ac.currentTime));
  assert.equal(srcs[0].frequency.calls[0][1], 293.66);
  assert.equal(typeof M.audioState.lastStart, 'number');
  assert.equal(M.audioState.lastEventTime, 12.5);
  assert.equal(M.audioState.lastVoice, 'xylo');
  assert.equal(M.audioState.taps, 1);
  assert.equal(M.audioState(), 'running', 'a suspended context is resumed by the tap');
}));

test('drum noise is built once (on unlock), not on every tap', async () => {
  const win = fakeWindow();
  global.window = win;
  const M = freshEngine();
  try {
    await M.unlockAudio();
    const ac = win.made[0];
    const built = ac.buffers;
    M.playTap('snare');
    M.playTap('hihat');
    M.playTap('clap');
    assert.equal(ac.buffers, built, 'no new buffer per tap');
    assert.equal(M.audioState.taps, 3);
  } finally { delete global.window; freshEngine(); }
});

test('muted: no tap and no sequence sound', () => withWindow((M) => {
  assert.equal(M.setMuted(true), true);
  assert.equal(M.playTap('bell'), null);
  assert.equal(M.scheduleSequence([{ at: 0, dur: 0.5, hz: 440 }]), null);
  assert.equal(M.audioState.taps, 0);
  M.setMuted(false);
  assert.ok(M.playTap('bell'));
}));

test('scheduleSequence returns its plan and can be replayed', () => withWindow((M) => {
  const r = M.scheduleSequence([{ fraction: 'quarter', hz: 220 }, { fraction: 'eighth', hz: 5000 }], { bpm: 120 });
  assert.deepEqual(r.plan.map((n) => n.hz), [220, 1760]);
  assert.equal(M.canReplay(), true);
  const again = M.replaySequence();
  assert.equal(again.length, 2);
  assert.ok(Math.abs(again[1].time - again[0].time - 0.5) < 1e-9);
}));
