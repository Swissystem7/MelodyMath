// #591 music games: the shared kit (instant world-instrument taps, the
// showMusic switch) and the music-games tab the five screens live in.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const JAM = require('../src/components/jamKit.js');
const engine = require('../src/lib/musicEngine.js');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

test('world-instrument voices become instant tap voices (drums keep their pitch, bells take data-hz)', () => {
  const iv = require('../src/lib/instrumentVoices.js');
  const drum = JAM.tapPartsFor(iv.VOICES.drumLow);
  assert.ok(drum[0].hz > 0 && drum[0].drop < drum[0].hz, 'a drum falls in pitch');
  assert.ok(drum.some((p) => p.noise), 'a drum has its noise burst');
  const bell = JAM.tapPartsFor(iv.VOICES.metalBell);
  assert.ok(bell.every((p) => p.hz === 0 && p.mul > 0), 'a bell is pitched by the button');
  assert.equal(JAM.registerTapVoices(), true);
  assert.ok(engine.tapPlan('drumLow').length > 0, 'data-tap="drumLow" is a known tap voice');
  assert.equal(engine.tapPlan('metalBell', 0, 440)[0].hz, 440);
});

test('stopAll() ends every running melody, and a mute mid-melody stops it (Refs #845)', async () => {
  const notes = [0, 0.2, 0.4, 0.6].map((at) => ({ at, voice: 'woodBar', hz: 440 }));
  const a = JAM.playNotes(notes), b = JAM.playNotes(notes);
  assert.equal(a.stopped || b.stopped, false);
  JAM.stopAll();
  assert.equal(a.stopped && b.stopped, true, 'the opening sound can silence what is playing');
  const c = JAM.playNotes(notes);
  engine.audioState.muted = true;
  try {
    await new Promise((ok) => setTimeout(ok, 120));
    assert.equal(c.stopped, true, 'the עכשיו לבד round mutes; the melody does not play on into it');
  } finally { engine.audioState.muted = false; }
});

test('the showMusic switch is on by default, kept per game, and labelled by its state', () => {
  const store = new Map();
  const s = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
  assert.equal(JAM.loadShowMusic('g1', s), true);
  JAM.saveShowMusic('g1', false, s);
  assert.equal(JAM.loadShowMusic('g1', s), false);
  assert.equal(JAM.loadShowMusic('g2', s), true, 'another game keeps its own choice');
  assert.match(JAM.musicToggleHtml(true), /aria-pressed="true"[^]*עם מוזיקה/);
  assert.match(JAM.musicToggleHtml(false), /aria-pressed="false"[^]*בלי מוזיקה/);
});

test('an unknown instrument falls back to a voice and a TODO source, never an invented one', () => {
  const x = JAM.instrument('no-such-instrument', 'woodBar');
  assert.equal(x.voice, 'woodBar');
  assert.equal(x.source, 'TODO');
  assert.equal(JAM.esc('<b a="1">&'), '&lt;b a=&quot;1&quot;&gt;&amp;');
});

test('index.html has the music-games tab and panel, and the kit loads after the instrument voices', () => {
  assert.match(html, /id="tab-musicGames" aria-controls="musicGames"/);
  assert.match(html, /<section id="musicGames" class="panel" role="tabpanel" aria-labelledby="tab-musicGames" hidden>[^]*<!-- #591 music games end -->/);
  const at = (src) => html.indexOf('<script src="' + src + '"></script>');
  ['src/lib/instrumentVoices.js', 'src/lib/instruments.js', 'src/components/jamKit.js'].forEach((s) => assert.ok(at(s) > 0, s + ' is loaded'));
  assert.ok(at('src/lib/musicEngine.js') < at('src/components/jamKit.js'));
  assert.ok(at('src/lib/instrumentVoices.js') < at('src/components/jamKit.js'));
  assert.match(html, /href="src\/components\/jam\.css"/);
});

test('every music-games script and stylesheet is precached for offline play', () => {
  const srcs = [...html.matchAll(/<script src="(src\/components\/[^"]+|src\/lib\/(?:music|review)\/[^"]+|src\/lib\/instrument[^"]+)"><\/script>/g)].map((m) => m[1]);
  srcs.push('src/components/jam.css');
  srcs.forEach((s) => assert.ok(sw.includes("'./" + s + "'"), s + ' is in sw.js ASSETS'));
});
