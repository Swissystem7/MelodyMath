const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../src/lib/musicEngine');

const f = (n, d) => ({ n, d });

test('note names are exact fractions of a whole note', () => {
  assert.deepEqual(M.durationToFraction('whole'), f(1, 1));
  assert.deepEqual(M.durationToFraction('half'), f(1, 2));
  assert.deepEqual(M.durationToFraction('quarter'), f(1, 4));
  assert.deepEqual(M.durationToFraction('eighth'), f(1, 8));
  assert.deepEqual(M.durationToFraction('sixteenth'), f(1, 16));
});

test('a dot multiplies by 3/2 and a triplet by 2/3', () => {
  assert.deepEqual(M.durationToFraction('dotted quarter'), f(3, 8));
  assert.deepEqual(M.durationToFraction({ name: 'half', dotted: true }), f(3, 4));
  assert.deepEqual(M.durationToFraction('quarter', { triplet: true }), f(1, 6));
  assert.deepEqual(M.durationToFraction('eighth-triplet'), f(1, 12));
  assert.equal(M.durationToFraction('crotchet'), null);
  assert.equal(M.durationToFraction(0.25), null);
});

test('3/8 is spelled as one dotted quarter', () => {
  const notes = M.fractionToDurations(f(3, 8));
  assert.equal(notes.length, 1);
  assert.equal(notes[0].name, 'quarter');
  assert.equal(notes[0].dotted, true);
  assert.equal(M.fractionToDurations('3/8')[0].dotted, true);
});

test('lengths without a single note become tied notes, longest first', () => {
  assert.deepEqual(M.fractionToDurations('5/8').map((n) => n.name), ['half', 'eighth']);
  assert.deepEqual(M.fractionToDurations('1/6').map((n) => [n.name, n.triplet]), [['quarter', true]]);
  assert.deepEqual(M.fractionToDurations('2').map((n) => [n.name, n.dotted]), [['whole', true], ['half', false]]);
  assert.equal(M.fractionToDurations('1/5'), null);
  assert.equal(M.fractionToDurations('1/32'), null);
  assert.equal(M.fractionToDurations('0'), null);
});

test('1/4 + 1/8 + 1/8 + 1/2 fills a 4/4 bar exactly', () => {
  const r = M.measureFill('4/4', ['1/4', '1/8', '1/8', '1/2']);
  assert.equal(r.fill, 'full');
  assert.deepEqual(r.remainder, f(0, 1));
  assert.equal(M.measureFill('4/4', ['quarter', 'eighth', 'eighth', 'half']).fill, 'full');
});

test('a short bar reports what is missing, an overfull bar what is extra', () => {
  assert.deepEqual(M.measureFill('3/4', ['half']), { fill: 'short', total: f(1, 2), bar: f(3, 4), remainder: f(1, 4) });
  const over = M.measureFill('2/4', ['half', 'eighth']);
  assert.equal(over.fill, 'over');
  assert.deepEqual(over.remainder, f(1, 8));
  assert.equal(M.measureFill('6/8', ['dotted quarter', 'dotted quarter']).fill, 'full');
  assert.equal(M.measureFill('6/8', ['quarter', 'quarter', 'quarter']).fill, 'full');
});

test('measureFill rejects unknown signatures and bad notes instead of guessing', () => {
  assert.equal(M.measureFill('5/4', ['whole']), null);
  assert.equal(M.measureFill('4/4', ['quarter', 'banana']), null);
  assert.equal(M.measureFill('4/4', [0.25]), null);
  assert.equal(M.measureFill('4/4', 'quarter'), null);
});

test('interval ratios are the simple whole-number ratios', () => {
  assert.deepEqual(M.intervalRatio('octave'), { p: 2, q: 1 });
  assert.deepEqual(M.intervalRatio('fifth'), { p: 3, q: 2 });
  assert.deepEqual(M.intervalRatio('fourth'), { p: 4, q: 3 });
  assert.deepEqual(M.intervalRatio('major third'), { p: 5, q: 4 });
  assert.equal(M.intervalRatio('tritone'), null);
});

test('ratioToHz, harmonic, bpmToSeconds and tempoChange', () => {
  assert.equal(M.ratioToHz(220, 2, 1), 440);
  assert.equal(M.ratioToHz(220, 3, 2), 330);
  assert.equal(M.ratioToHz(220, 0, 1), null);
  assert.equal(M.harmonic(3, 110), 330);
  assert.equal(M.harmonic(0, 110), null);
  assert.equal(M.harmonic(1.5, 110), null);
  assert.equal(M.bpmToSeconds(60), 1);
  assert.equal(M.bpmToSeconds(120), 0.5);
  assert.equal(M.bpmToSeconds(0), null);
  assert.equal(M.tempoChange(80, 25), 100);
  assert.equal(M.tempoChange(120, -50), 60);
  assert.equal(M.tempoChange(100, -100), null);
});

test('a fraction of the monochord string multiplies the pitch by its inverse', () => {
  assert.deepEqual(M.stringLength(f(1, 2)), f(2, 1));
  assert.deepEqual(M.stringLength('2/3'), f(3, 2));
  assert.deepEqual(M.stringLength('3/4'), f(4, 3));
  assert.deepEqual(M.stringLength('1'), f(1, 1));
  assert.equal(M.stringLength('3/2'), null);
  assert.equal(M.stringLength('0/1'), null);
});

test('safety: gain is capped at 0.3 and pitch stays within 110–1760 Hz', () => {
  assert.equal(M.MAX_GAIN, 0.3);
  assert.equal(M.clampGain(5), 0.3);
  assert.equal(M.clampGain(-1), 0);
  assert.equal(M.clampGain(NaN), 0);
  assert.equal(M.clampHz(20), 110);
  assert.equal(M.clampHz(20000), 1760);
  assert.equal(M.clampHz(440), 440);
  const plan = M.planSequence([{ at: 0, dur: 0.5, hz: 5000, gain: 1 }, { at: 1, dur: 0.001, hz: 50 }], 10);
  assert.deepEqual(plan.map((n) => [n.time, n.hz, n.gain]), [[10, 1760, 0.3], [11, 110, 0.2]]);
  assert.ok(plan[1].dur >= 0.05, 'a very short note still gets room for its attack and release');
});

test('planSequence lays fraction notes end to end at the given tempo', () => {
  const plan = M.planSequence([
    { fraction: 'quarter', hz: 220 }, { fraction: 'eighth', rest: true }, { fraction: '1/8', hz: 330 },
  ], 2, { bpm: 60 });
  assert.deepEqual(plan.map((n) => [n.time, n.dur, n.hz]), [[2, 1, 220], [3.5, 0.5, 330]]);
  assert.deepEqual(M.planSequence('nope', 0), []);
});

test('the audio half is inert in Node', () => {
  assert.equal(M.getSharedAudioContext(), null);
  assert.equal(M.scheduleSequence([{ at: 0, dur: 1, hz: 440 }]), null);
  return M.unlockAudio().then((state) => assert.equal(state, 'unavailable'));
});

function fakeWindow() {
  const made = [];
  function Param() { this.calls = []; }
  ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime']
    .forEach((k) => { Param.prototype[k] = function (v, t) { this.calls.push([k, v, t]); }; });
  function node() {
    return { frequency: new Param(), gain: new Param(), connect(n) { return n || this; }, disconnect() {}, start() {}, stop() {} };
  }
  function AC() { made.push(this); this.state = 'suspended'; this.currentTime = 3; this.destination = {}; }
  AC.prototype.resume = function () { this.state = 'running'; return Promise.resolve(); };
  AC.prototype.createOscillator = function () { const n = node(); (this.oscs = this.oscs || []).push(n); return n; };
  AC.prototype.createGain = function () { const n = node(); (this.gains = this.gains || []).push(n); return n; };
  AC.prototype.createBuffer = function () { return {}; };
  AC.prototype.createBufferSource = function () { return node(); };
  return { AudioContext: AC, made };
}

test('one shared context: unlocked by a tap, reused by sonify, timed on currentTime', async () => {
  const win = fakeWindow();
  global.window = win;
  try {
    win.getSharedAudioContext = M.getSharedAudioContext;
    const listeners = {};
    const target = {
      addEventListener(type, fn) { listeners[type] = fn; },
      removeEventListener(type) { delete listeners[type]; },
    };
    assert.equal(M.installAudioUnlock(target), true);
    assert.equal(win.made.length, 0, 'no context before a gesture');
    listeners.pointerdown();
    assert.equal(listeners.pointerdown, undefined, 'the unlock runs once');
    await new Promise((r) => setTimeout(r, 0));
    const ac = M.getSharedAudioContext();
    assert.equal(ac.state, 'running');
    delete require.cache[require.resolve('../src/lib/sonify')];
    const sonify = require('../src/lib/sonify');
    assert.equal(sonify.getAudioContext(), ac);
    assert.equal(win.made.length, 1, 'sonify did not open a second context');
    const r = M.scheduleSequence([{ at: 0, dur: 0.5, hz: 440, gain: 0.9 }]);
    assert.equal(r.startTime, ac.currentTime + 0.05);
    const gainCalls = ac.gains[0].gain.calls;
    assert.ok(gainCalls.every(([, v]) => v <= 0.3), 'gain never above 0.3');
    assert.equal(gainCalls[0][1], 0.0001, 'the note starts from silence (no click)');
    assert.equal(gainCalls[gainCalls.length - 1][1], 0.0001, 'and fades back to silence');
  } finally {
    delete global.window;
    delete require.cache[require.resolve('../src/lib/sonify')];
  }
});

test('index.html loads the engine before sonify and installs the unlock; sw.js caches it', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const engine = html.indexOf('src="src/lib/musicEngine.js"');
  assert.ok(engine > 0 && engine < html.indexOf('src="src/lib/sonify.js"'));
  assert.match(html, /installAudioUnlock\(document\)/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /'\.\/src\/lib\/musicEngine\.js'/);
});

test('12-TET fifth is 2^(7/12), about 2 cents under the pure 3/2', () => {
  assert.equal(M.equalTemperedRatio(12), 2);
  assert.equal(M.equalTemperedRatio(0), 1);
  assert.ok(Math.abs(M.equalTemperedRatio(7) - 1.4983) < 1e-4);
  assert.equal(M.equalTemperedRatio(0.5), null);
  assert.ok(Math.abs(M.centsBetween(1, 2) - 1200) < 1e-9);
  assert.ok(Math.abs(M.centsBetween(1.5, M.equalTemperedRatio(7)) + 1.955) < 0.001);
  assert.equal(M.centsBetween(0, 1), null);
});

test('freq-lab.html: linked from index, precached, numbers from the engine, unlock on first tap', () => {
  const root = path.join(__dirname, '..');
  const page = fs.readFileSync(path.join(root, 'freq-lab.html'), 'utf8');
  assert.match(page, /src="src\/lib\/musicEngine\.js"/);
  assert.match(page, /installAudioUnlock\(document\)/);
  ['ratioToHz', 'harmonic', 'stringLength', 'equalTemperedRatio', 'centsBetween', 'scheduleSequence']
    .forEach((fn) => assert.ok(page.includes(fn + '('), fn));
  assert.match(page, /id="again"/, 'a visible play-again button');
  assert.match(page, /role="status" aria-live="polite"/, 'every sound is also written out');
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /href="freq-lab\.html"/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /'\.\/freq-lab\.html'/);
});
