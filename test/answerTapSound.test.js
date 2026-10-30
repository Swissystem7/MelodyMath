// #665/#680: every answer tap sounds within 100 ms, correct and wrong sound
// different. Replay after mistake is owned by #722 (encouragingFeedback) and
// must not be duplicated here (#744, DEDUP-722-744).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ENGINE = require.resolve('../src/lib/musicEngine');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const metro = require('../src/lib/metro.js');

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

function fakeAnswerButton() {
  const classes = new Set();
  const el = {
    attrs: { 'data-tap': 'xylo' }, offsetWidth: 40, disabled: false,
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), has: (c) => classes.has(c) },
    closest(sel) { return sel === '[data-tap]' ? this : null; },
  };
  return el;
}

function withEnv(fn) {
  global.window = fakeAudioWindow();
  const M = freshEngine();
  try { return fn(M); } finally { delete global.window; freshEngine(); }
}

test('every tap event on an answer button triggers a sound, within 100 ms', () => withEnv((M) => {
  const on = {};
  const doc = { addEventListener(type, fn) { on[type] = fn; } };
  assert.equal(M.installTapFeedback(doc), true);
  for (let i = 0; i < 5; i++) {
    const before = M.audioState.taps;
    const t0 = performance.now();
    on.pointerdown({ target: fakeAnswerButton(), timeStamp: t0, pointerId: i + 1 });
    assert.equal(M.audioState.taps, before + 1, 'tap ' + i + ' sounded exactly once');
    const ms = M.audioState.lastStart - M.audioState.lastEventTime;
    assert.ok(ms >= 0 && ms < 100, 'tap ' + i + ' started in ' + ms + ' ms');
  }
}));

test('correct and wrong answer sounds are distinct', () => {
  const M = freshEngine();
  const right = M.tapPlan('correct');
  const wrong = M.tapPlan('wrong');
  assert.ok(right.length && wrong.length);
  assert.notDeepEqual(right.map((p) => p.hz), wrong.map((p) => p.hz));
  assert.ok(right[1].hz > right[0].hz, 'correct rises');
  assert.ok(wrong[1].hz < wrong[0].hz, 'wrong falls');
});

test('every answer surface in index.html is a tap voice (sounds on pointerdown)', () => {
  assert.match(html, /id="check" data-tap="xylo"/);
  assert.match(html, /id="rmCheck" data-tap="xylo"/);
  assert.match(html, /id="rmPlanCheck" data-tap="xylo"/);
  assert.match(html, /if\(!q\.noMusic\)b\.setAttribute\('data-tap','xylo'\);b\.onclick=\(\)=>pickClass\(v,b\)/, 'class choices (silent noMusic rounds stay quiet)');
  assert.match(html, /b\.setAttribute\('data-tap','xylo'\); b\.onclick=\(\)=>pickBeat\(v,b\)/, 'beat choices');
  assert.match(html, /class="secondary quiz-choice" data-tap="xylo"/, 'guided-lesson choices');
  assert.match(html, /if\(!correct && typeof playTap==='function'\) playTap\('wrong'\)/, 'wrong feedback');
  assert.match(html, /playTap\(correct && !late \? 'correct' : 'wrong'\)/, 'beat feedback is distinct');
});

test('replay-after-mistake is deduplicated: noteMetro does not duplicate replay, replay fires exactly once via #722 (DEDUP-722-744)', () => {
  // 1. replayPhraseAfterMistake was removed from index.html
  assert.equal(html.includes('function replayPhraseAfterMistake()'), false, 'duplicate replay function removed');
  assert.equal(html.includes('replayPhraseAfterMistake'), false, 'no duplicate replay calls in index.html');

  // 2. noteMetro only plays tap sound 'wrong' and does not schedule a phrase replay
  const start = html.indexOf('let metroTimer=null');
  const end = html.indexOf("document.addEventListener('visibilitychange'", start);
  const block = html.slice(start, end);

  const played = [];
  const timers = [];
  const els = { metroBpm: { value: '80' }, metroAccel: { checked: false } };
  const sandbox = Object.assign({}, metro, {
    $: (id) => els[id] || null,
    playClick() {}, setInterval: () => 1, clearInterval() {},
    setTimeout: (fn, ms) => { timers.push([fn, ms]); return timers.length; },
    playTap: (voice) => played.push(voice),
    getActiveHear: () => [3, 2],
    maybeHear: (item) => played.push(['hear', item.hear || item]),
    playStreakMelody() {}, recordCorrect: () => null,
  });
  vm.createContext(sandbox);
  vm.runInContext(block + '\nthis.api={noteMetro};', sandbox);
  sandbox.api.noteMetro(false);
  assert.deepEqual(played, ['wrong'], 'only the tap sound plays, no duplicate replay');
  assert.equal(timers.length, 0, 'no duplicate replay scheduled by noteMetro');

  // 3. Replay fires exactly once on mistake via encouragingFeedback in check()
  const replayCalls = [];
  const mockCurrent = { id: 1, answer: 10, hear: [3, 2], _retryDone: false };
  const checkSandbox = {
    answered: false,
    current: mockCurrent,
    history: [],
    normalizeAnswer: (v) => v,
    isCorrect: (given, ans) => Number(given) === Number(ans),
    askForAnswer: () => {},
    maybeHear: (item) => replayCalls.push(item),
    maybeSpeak: () => {},
    noteMetro: () => {},
    logTeacherItem: () => {},
    mathHtml: (v) => String(v),
    show: () => {},
    setTimeout: (fn) => fn(),
    $: () => ({ value: '5', className: '', innerHTML: '', style: {}, focus: () => {} }),
    MM_FEEDBACK: { getVisualMathAnimation: () => null }
  };

  const checkStart = html.indexOf('function check(){');
  const checkEnd = html.indexOf('\nfunction finish(){', checkStart);
  const checkCode = html.slice(checkStart, checkEnd);
  vm.createContext(checkSandbox);
  vm.runInContext(checkCode + '\nthis.check = check;', checkSandbox);

  checkSandbox.check();
  assert.equal(replayCalls.length, 1, 'replay fires exactly once on mistake');
  assert.equal(mockCurrent._retryDone, true);

  // Subsequent check does not fire another replay
  checkSandbox.check();
  assert.equal(replayCalls.length, 1, 'replay does not fire again');
});
