'use strict';
// Every exercise opens with a sound within 1 s (Refs #665 req 2a): the item's
// music or a neutral chime, deferred to the first tap when autoplay is blocked.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createOpenCue, CHIME_HZ } = require('../src/lib/openCue');

const root = path.join(__dirname, '..');

function fakeCtx(state) {
  const ctx = {
    state: state || 'running', currentTime: 3, destination: {}, starts: [], resumes: 0,
    resume() { ctx.resumes++; return ctx.onResume ? ctx.onResume() : new Promise(() => {}); },
    createOscillator() {
      const o = { type: '', hz: null, frequency: { setValueAtTime(v) { o.hz = v; } },
        connect: (n) => n, disconnect() {}, stop() {},
        start(t) { ctx.starts.push({ t, wall: Date.now(), type: o.type, hz: o.hz }); } };
      return o;
    },
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
        connect: (n) => n, disconnect() {} };
    },
  };
  return ctx;
}

// Wall-clock from `since` to the first scheduled start, plus its offset from currentTime.
function firstSoundMs(ctx, since) {
  assert.ok(ctx.starts.length, 'nothing was scheduled');
  const s = ctx.starts[0];
  return (s.wall - since) + (s.t - ctx.currentTime) * 1000;
}

function cue(ctx, extra) {
  const calls = [];
  const c = createOpenCue(Object.assign({
    getContext: () => ctx,
    playItemMusic: (it) => { calls.push(it); return false; },
    isMuted: () => false,
    target: new EventTarget(),
  }, extra));
  return { c, calls };
}

test('an item with no music of its own opens with the C5-G5 triangle chime within 1 s', () => {
  const ctx = fakeCtx();
  const { c, calls } = cue(ctx);
  const item = { prompt: '3 + 4' };
  const t0 = Date.now();
  assert.equal(c.open(item), true);
  assert.equal(calls.length, 1, 'the item music is tried first');
  assert.ok(firstSoundMs(ctx, t0) < 1000);
  assert.deepEqual(ctx.starts.map((s) => s.hz), CHIME_HZ);
  assert.ok(ctx.starts.every((s) => s.type === 'triangle'));
});

test('an item with its own music plays it through sonify playCountClicks within 1 s, no chime', () => {
  const ctx = fakeCtx();
  globalThis.window = { AudioContext: function () { return ctx; } };
  try {
    const sonify = require('../src/lib/sonify');
    const { c } = cue(ctx, { playItemMusic: (it) => { sonify.playCountClicks(it.hear, it.bpm); return true; } });
    const t0 = Date.now();
    c.open({ prompt: '3 + 2', hear: [3, 2], bpm: 90 });
    assert.ok(firstSoundMs(ctx, t0) < 1000);
    assert.equal(ctx.starts.length, 5, 'five count clicks and nothing else');
    assert.ok(!ctx.starts.some((s) => CHIME_HZ.includes(s.hz)));
  } finally { delete globalThis.window; }
});

test('autoplay blocked: the sound waits and starts within 1 s of the first tap or key', () => {
  for (const type of ['pointerdown', 'keydown']) {
    const ctx = fakeCtx('suspended');
    const target = new EventTarget();
    const { c } = cue(ctx, { target });
    assert.equal(c.open({ prompt: '5 - 1' }), 'deferred');
    assert.equal(ctx.starts.length, 0, 'nothing plays into a suspended context');
    assert.ok(c.isPending());
    ctx.state = 'running';
    const tap = Date.now();
    target.dispatchEvent(new Event(type));
    assert.ok(firstSoundMs(ctx, tap) < 1000, type);
    target.dispatchEvent(new Event(type));
    assert.equal(ctx.starts.length, 2, 'fires once');
  }
});

test('autoplay blocked: a resume() that succeeds plays the deferred sound', async () => {
  const ctx = fakeCtx('suspended');
  ctx.onResume = () => { ctx.state = 'running'; return Promise.resolve(); };
  const { c } = cue(ctx);
  c.open({ prompt: '2 x 3' });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(ctx.starts.length, 2);
});

test('mute (at open or before a deferred sound fires) and noMusic stay silent', () => {
  let muted = true;
  const ctx = fakeCtx();
  const { c, calls } = cue(ctx, { isMuted: () => muted });
  assert.equal(c.open({ prompt: 'a' }), false);
  muted = false;
  assert.equal(c.open({ prompt: 'b', noMusic: true }), false);
  assert.equal(ctx.starts.length + calls.length, 0);

  const blocked = fakeCtx('suspended');
  const target = new EventTarget();
  let m2 = false;
  const d = cue(blocked, { target, isMuted: () => m2 });
  d.c.open({ prompt: 'c' });
  m2 = true;
  target.dispatchEvent(new Event('pointerdown'));
  assert.equal(blocked.starts.length + d.calls.length, 0);
});

test('a replay of the same item only replays its music; chimeOnly holds the music back', () => {
  const ctx = fakeCtx();
  const { c, calls } = cue(ctx);
  const item = { prompt: '6 / 2' };
  c.open(item);
  assert.equal(ctx.starts.length, 2);
  c.open(item);
  assert.equal(ctx.starts.length, 2, 'no second chime on replay');
  assert.equal(calls.length, 2);

  const ctx2 = fakeCtx();
  const p = cue(ctx2);
  const predicted = { prompt: '4 + 4', hear: [4, 4] };
  p.c.open(predicted, { chimeOnly: true });
  assert.equal(p.calls.length, 0, 'the answer music waits for the prediction');
  assert.equal(ctx2.starts.length, 2);
  p.c.open(predicted);
  assert.equal(p.calls.length, 1);
  assert.equal(ctx2.starts.length, 2);
});

test('every exercise screen in index.html opens through maybeHear, which routes via openCue', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const fn of ['renderExercise', 'rmRender', 'rpRender', 'nextClassQuestion', 'nextBeatQuestion']) {
    const at = html.indexOf('function ' + fn + '(');
    assert.ok(at > 0, fn + ' not found');
    const body = html.slice(at, html.indexOf('\nfunction ', at + 1));
    assert.match(body, /maybeHear\(/, fn + ' does not call maybeHear');
  }
  assert.match(html, /maybeHear\(it,\{chimeOnly:true\}\)/, 'a prediction item opens with the chime only');
  assert.match(html, /setActiveHear\(how&&how\.chimeOnly\?null:/, 'the chime-only open keeps the hear button off until the child predicts');
  assert.match(html, /function maybeHear\(item,how\)\{[^\n]*cue\.open\(item,how\)/);
  assert.match(html, /function playItemMusic\(item\)\{/);
  assert.ok(html.indexOf('src="src/lib/openCue.js"') > html.indexOf('src="src/lib/sonify.js"'));
  assert.ok(fs.readFileSync(path.join(root, 'sw.js'), 'utf8').includes("'./src/lib/openCue.js'"));
});

test('no audio: a null context, no AudioContext or no createOscillator opens silently without throwing', () => {
  assert.equal(createOpenCue().open({ prompt: '1 + 1' }), false, 'no options at all');
  const { c, calls } = cue(null);
  assert.equal(c.open({ prompt: '2 + 2' }), false);
  assert.equal(c.isPending(), false);
  assert.equal(calls.length, 1, 'item music is still tried; it reports nothing played');
  assert.equal(cue({ state: 'running', currentTime: 0 }).c.open({ prompt: '3 + 3' }), false);
  assert.equal(require('../src/lib/openCue').playChime(null), null);
});

test('blocked audio whose resume() throws, then vanishes, does not throw and stays silent', () => {
  let ctx = fakeCtx('suspended');
  ctx.resume = () => { throw new Error('NotAllowedError'); };
  const target = new EventTarget();
  const { c } = cue(null, { target, getContext: () => ctx });
  assert.equal(c.open({ prompt: '4 - 1' }), 'deferred');
  const blocked = ctx;
  ctx = null;
  assert.doesNotThrow(() => target.dispatchEvent(new Event('pointerdown')));
  assert.equal(blocked.starts.length, 0);
  assert.equal(c.isPending(), false);
});

test('muted at open with autoplay blocked: nothing is queued for the next tap', () => {
  const ctx = fakeCtx('suspended');
  const target = new EventTarget();
  const { c, calls } = cue(ctx, { target, isMuted: () => true });
  assert.equal(c.open({ prompt: '5 + 5' }), false);
  assert.equal(c.isPending(), false);
  target.dispatchEvent(new Event('keydown'));
  assert.equal(ctx.starts.length + calls.length + ctx.resumes, 0);
});
