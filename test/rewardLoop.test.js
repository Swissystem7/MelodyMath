// #591 goal A.4: reward loop - streak melodies, a tune when a level is
// completed, instruments unlocked by progress. Musical rewards only: no
// points, no penalty sound, nothing taken away after a mistake.
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
const M = freshEngine();

function memStore() {
  const data = {};
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
}

test('the streak melody grows one note per right answer, up to 8', () => {
  assert.deepEqual(M.streakMelody(0), [], 'no streak, no melody (and no penalty sound)');
  assert.deepEqual(M.streakMelody(-2), []);
  for (let s = 1; s <= 10; s++) {
    const melody = M.streakMelody(s).filter((n) => n.layer === 'melody');
    assert.equal(melody.length, Math.min(s, 8), 'streak ' + s);
  }
  const m = M.streakMelody(5).filter((n) => n.layer === 'melody');
  for (let i = 1; i < m.length; i++) assert.ok(m[i].at > m[i - 1].at, 'the notes come one after another');
});

test('every 3 in a row adds a layer: bass, harmony, sparkle', () => {
  assert.deepEqual(M.streakLayers(2), []);
  assert.deepEqual(M.streakLayers(3), ['bass']);
  assert.deepEqual(M.streakLayers(6), ['bass', 'harmony']);
  assert.deepEqual(M.streakLayers(9), ['bass', 'harmony', 'sparkle']);
  assert.deepEqual(M.streakLayers(30), ['bass', 'harmony', 'sparkle']);
  for (const s of [3, 6, 9, 12]) {
    const layers = [...new Set(M.streakMelody(s).map((n) => n.layer))].filter((l) => l !== 'melody');
    assert.deepEqual(layers, M.streakLayers(s), 'streak ' + s);
  }
});

test('rewards stay gentle and inside the safe band', () => {
  const all = [].concat(M.streakMelody(12), M.levelTune());
  const plan = M.planSequence(all, 0);
  assert.equal(plan.length, all.length, 'nothing is dropped by the clamp');
  for (const n of plan) {
    assert.ok(n.gain <= 0.16, 'quiet: ' + n.gain);
    assert.ok(n.hz >= M.HZ_MIN && n.hz <= M.HZ_MAX);
  }
});

test('the level tune is a rising cadence that ends on a chord', () => {
  const t = M.levelTune();
  const lead = t.filter((n) => n.at < 0.5);
  assert.deepEqual(lead.map((n) => n.hz), [392.00, 329.63, 392.00, 523.25]);
  assert.equal(t.filter((n) => n.at === 0.5).length, 4, 'the chord plays together');
});

test('#717: every strip voice is available from the start, with no unlock state', () => {
  assert.equal(M.TAP_UNLOCKS, undefined, 'no unlock table');
  assert.equal(M.unlockedVoices, undefined);
  assert.equal(M.announceUnlock, undefined, 'no "new instrument" popup');
  for (const v of M.ALL_TAP_VOICES) assert.ok(M.TAP_VOICES[v], v + ' is a real voice');
  const voices = M.padFor('M6', M.ALL_TAP_VOICES).keys.map((k) => k.voice);
  for (const v of M.ALL_TAP_VOICES) assert.ok(voices.includes(v), v + ' on the strip with zero right answers');
  // Right answers are still counted, but open nothing.
  const store = memStore();
  assert.equal(M.loadTapProgress(store).count, 0);
  for (let i = 0; i < 60; i++) assert.deepEqual(M.recordCorrect(store), { count: i + 1 });
  assert.equal(M.loadTapProgress({ getItem: () => '{oops' }).count, 0);
  assert.equal(M.recordCorrect({ getItem: () => null, setItem: () => { throw new Error('full'); } }).count, 1);
});

function fakeAudioWindow(log) {
  function Param() {}
  ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime'].forEach((k) => { Param.prototype[k] = function () {}; });
  function AC() { this.state = 'running'; this.currentTime = 1; this.destination = {}; }
  AC.prototype.createOscillator = () => ({ frequency: new Param(), connect(x) { return x; }, start(t) { log.push(t); }, stop() {}, disconnect() {} });
  AC.prototype.createGain = () => ({ gain: new Param(), connect(x) { return x; } });
  AC.prototype.createBufferSource = AC.prototype.createOscillator;
  AC.prototype.createBuffer = () => ({ getChannelData: () => new Float32Array(4) });
  return { AudioContext: AC };
}

test('a level tune waits for the streak melody instead of cutting it; mute silences both', () => {
  const starts = [];
  global.window = fakeAudioWindow(starts);
  try {
    const E = freshEngine();
    const a = E.playStreakMelody(4);
    const b = E.playLevelTune();
    assert.ok(a && b);
    assert.ok(b.startTime >= a.endTime - 1e-9, 'queued after the melody');
    assert.equal(starts.length, a.notes + b.notes);
    E.setMuted(true);
    assert.equal(E.playStreakMelody(3), null);
    assert.equal(E.playLevelTune(), null);
  } finally {
    delete global.window;
    freshEngine();
  }
});

test('index.html: right answers play the streak melody and open no unlock popup; level-ups play the tune', () => {
  assert.match(html, /if\(!correct && typeof playTap==='function'\) playTap\('wrong'\)/, 'a wrong answer keeps its soft step');
  assert.match(html, /else if\(correct && typeof playStreakMelody==='function'\)\{\s*if\(!won\) playStreakMelody\(metroStreak \+ 1\);/);
  assert.match(html, /if\(typeof recordCorrect==='function'\) recordCorrect\(\);/);
  assert.doesNotMatch(html, /announceUnlock|unlocks\.js/, '#717: no unlock popup, no unlock script');
  assert.match(html, /const lv0=it\.level\|\|st\.level\|\|1;st\.level=nextLevel\(lv0,st\.history\.slice\(-2\)\);noteMetro\(correct,st\.skill\|\|st\.he,it\);if\(st\.level>lv0&&typeof playLevelTune==='function'\)playLevelTune\(\);/);
  assert.match(html, /if\(beatLevel>lv0 && typeof playLevelTune==='function'\) playLevelTune\(\);/);
  assert.match(html, /\.mm-unlock\{position:fixed/);
});
