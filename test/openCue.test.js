// #665 requirement 2a: when an exercise opens, a sound starts within one
// second. The delay is measured, not assumed: wall-clock time from the open
// call to the moment a node is scheduled, plus how far ahead of
// AudioContext.currentTime that node was scheduled to start.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const cueLib = require('../src/lib/openCue.js');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function param() {
  return { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} };
}

// A fake AudioContext that records when the first sound is set to start.
function fakeContext(state) {
  const ac = {
    state: state || 'running',
    currentTime: 3.5,
    destination: {},
    starts: [],
    firstSoundAt: null,
    resume() { return Promise.reject(new Error('autoplay blocked')); },
    createOscillator() {
      return {
        type: '', frequency: param(),
        connect(n) { return n; }, disconnect() {}, stop() {},
        start(when) {
          ac.starts.push(when);
          if (ac.firstSoundAt === null) {
            ac.firstSoundAt = performance.now() + Math.max(0, when - ac.currentTime) * 1000;
          }
        },
      };
    },
    createGain() { return { gain: param(), connect(n) { return n; }, disconnect() {} }; },
  };
  return ac;
}

function fakeTarget() {
  const handlers = {};
  return {
    handlers,
    addEventListener(type, fn) { (handlers[type] = handlers[type] || []).push(fn); },
    fire(type) { (handlers[type] || []).forEach((fn) => fn({ type })); },
  };
}

function delayMs(openedAt, ac) {
  assert.notEqual(ac.firstSoundAt, null, 'no sound was scheduled');
  return ac.firstSoundAt - openedAt;
}

test('an item with no music of its own still opens with a sound under 1 s', () => {
  const ac = fakeContext();
  const cue = cueLib.createOpenCue({ getContext: () => ac, isQuiet: () => false });
  const t0 = performance.now();
  const r = cue.open({ prompt: '3 + 4' }, () => false);
  assert.equal(r.status, 'played');
  const d = delayMs(t0, ac);
  assert.ok(d < cueLib.DEADLINE_MS, `delay ${d.toFixed(1)} ms`);
  assert.equal(ac.starts.length, cueLib.CHIME.length);
});

test('the real count-click path (sonify.playCountClicks) starts under 1 s, and no chime is added on top', () => {
  const ac = fakeContext();
  const prevWindow = global.window;
  global.window = { AudioContext: function () {}, getSharedAudioContext: () => ac };
  try {
    delete require.cache[require.resolve('../src/lib/sonify.js')];
    const sonify = require('../src/lib/sonify.js');
    const cue = cueLib.createOpenCue({ getContext: () => ac, isQuiet: () => false });
    const t0 = performance.now();
    cue.open({ hear: [3, 2] }, () => { sonify.playCountClicks([3, 2], 76); return true; });
    const d = delayMs(t0, ac);
    assert.ok(d < cueLib.DEADLINE_MS, `delay ${d.toFixed(1)} ms`);
    assert.equal(ac.starts.length, 5, 'five clicks, no extra chime');
  } finally {
    global.window = prevWindow;
  }
});

test('the mute toggle and no-music checks stay silent', () => {
  const ac = fakeContext();
  let quiet = true;
  const cue = cueLib.createOpenCue({ getContext: () => ac, isQuiet: () => quiet });
  assert.equal(cue.open({ prompt: 'a' }, () => false).status, 'muted');
  quiet = false;
  assert.equal(cue.open({ prompt: 'b', noMusic: true }, () => false).status, 'no-music');
  assert.equal(ac.starts.length, 0);
});

test('blocked autoplay: the sound waits for the first tap, then starts under 1 s from it', async () => {
  const ac = fakeContext('suspended');
  const target = fakeTarget();
  let unlocked = 0;
  const cue = cueLib.createOpenCue({
    getContext: () => ac,
    isQuiet: () => false,
    unlock: () => { unlocked++; ac.state = 'running'; return Promise.resolve('running'); },
    target,
  });
  assert.equal(cue.open({ prompt: '5 - 2' }, () => false).status, 'waiting');
  await Promise.resolve();
  assert.equal(ac.starts.length, 0, 'nothing is scheduled on a blocked context');
  assert.ok(cue.hasPending());
  const t0 = performance.now();
  target.fire('pointerdown');
  assert.equal(unlocked, 1);
  const d = delayMs(t0, ac);
  assert.ok(d < cueLib.DEADLINE_MS, `delay ${d.toFixed(1)} ms after the tap`);
  assert.equal(cue.hasPending(), false);
  target.fire('pointerdown');
  assert.equal(ac.starts.length, cueLib.CHIME.length, 'a second tap does not replay it');
});

test('a context that resumes on its own (page already tapped) plays without a gesture', async () => {
  const ac = fakeContext('suspended');
  ac.resume = () => { ac.state = 'running'; return Promise.resolve(); };
  const cue = cueLib.createOpenCue({ getContext: () => ac, isQuiet: () => false });
  cue.open({ prompt: '6 + 1' }, () => false);
  await new Promise((r) => setImmediate(r));
  assert.equal(ac.starts.length, cueLib.CHIME.length);
});

test('the replay after a mistake (same item) never adds the chime', () => {
  const ac = fakeContext();
  const cue = cueLib.createOpenCue({ getContext: () => ac, isQuiet: () => false });
  const item = { prompt: '2 + 2' };
  cue.open(item, () => false);
  cue.open(item, () => false);
  assert.equal(ac.starts.length, cueLib.CHIME.length);
});

// The screen the child sees: run index.html's own maybeHear and measure it.
test('index.html: maybeHear on a fresh exercise makes a sound under 1 s', () => {
  const start = html.indexOf('const openCue=');
  const end = html.indexOf('\n', html.indexOf('function playItemMusic('));
  assert.ok(start > 0 && end > start, 'openCue wiring is in index.html');
  const ac = fakeContext();
  const ctx = {
    MM_OPEN_CUE: cueLib,
    document: { addEventListener() {}, querySelector: () => null },
    getSharedAudioContext: () => ac,
    unlockAudio: () => null,
    prefsNow: () => ({ quiet: false }),
    setActiveHear() {},
  };
  vm.createContext(ctx);
  vm.runInContext(html.slice(start, end) + '\nthis.maybeHear=maybeHear;', ctx);
  const t0 = performance.now();
  ctx.maybeHear({ prompt: '7 + 1' });
  const d = delayMs(t0, ac);
  assert.ok(d < cueLib.DEADLINE_MS, `delay ${d.toFixed(1)} ms`);

  const quietAc = fakeContext();
  ctx.getSharedAudioContext = () => quietAc;
  ctx.prefsNow = () => ({ quiet: true });
  ctx.maybeHear({ prompt: '8 + 1' });
  assert.equal(quietAc.starts.length, 0, 'muted in the access panel = silent');
});

test('index.html: every exercise screen calls the open sound', () => {
  assert.match(html, /<script src="src\/lib\/openCue\.js"><\/script>/);
  assert.match(html, /setActiveHear\(null\);if\(typeof maybeHear==='function'\)maybeHear\(current\);maybeSpeak\(current\.prompt\)/, 'practice quiz');
  assert.match(html, /show\('rmNext',false\);maybeHear\(q\);/, 'diagnostic');
  assert.match(html, /\)\)\)maybeHear\(it\);else if\(openCue\)openCue\.open\(it\);/, 'personal plan, also behind a prediction');
  assert.match(html, /firstChoice\.focus\(\);maybeHear\(q\);/, 'class mode');
  assert.match(html, /maybeHear\(q\); maybeSpeak\(q\.prompt\);/, 'beat mode');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.ok(sw.includes("'./src/lib/openCue.js'"), 'cached for offline use');
});
