const test = require('node:test');
const assert = require('node:assert/strict');
const groove = require('../src/lib/music/groove');
const streak = require('../src/lib/music/streak');

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
  };
}

test('buildGroove(4) accents exactly beats 4, 8, 12, ...', () => {
  const g = groove.buildGroove(4);
  assert.equal(g.mechanism, 'M2');
  assert.equal(g.bpm, 90);
  assert.equal(g.beats.length, 40);
  assert.deepEqual(groove.accentedBeats(g), [4, 8, 12, 16, 20, 24, 28, 32, 36, 40]);
  assert.equal(g.beats[3].product, 4);
  assert.equal(g.beats[2].product, null);
  assert.equal(g.beats.filter((b) => b.accent).every((b) => b.index % 4 === 0), true);
});

test('beat times follow the tempo', () => {
  const g = groove.buildGroove(3, 120, 2);
  assert.deepEqual(g.beats.map((b) => b.timeMs), [0, 500, 1000, 1500, 2000, 2500]);
  assert.deepEqual(groove.accentedBeats(g), [3, 6]);
  assert.equal(groove.buildGroove(0), null);
  assert.equal(groove.buildGroove(4, 1000), null);
});

test('the groove stops mid-way and asks 4 × 7', () => {
  const g = groove.buildGroove(4, 90);
  const q = groove.stopAt(g, 7);
  assert.equal(q.question, '4 × 7');
  assert.equal(q.answer, 28);
  assert.equal(q.played.length, 27);
  assert.equal(groove.stopAt(g, 11), null);
});

test('division reads the same groove: how many accented groups', () => {
  const g = groove.buildGroove(4);
  assert.equal(groove.groupsIn(g, 28), 7);
  assert.equal(groove.groupsIn(g, 30), null);
});

test('3 correct in a row add a layer; a wrong answer resets the streak and keeps the layer', () => {
  let s = streak.initialStreak();
  let r;
  r = streak.recordAnswer(s, true); s = r.state;
  r = streak.recordAnswer(s, true); s = r.state;
  assert.equal(r.layerAdded, null);
  r = streak.recordAnswer(s, true); s = r.state;
  assert.equal(r.layerAdded, 'bass');
  assert.equal(r.sound, 'layer');
  r = streak.recordAnswer(s, false); s = r.state;
  assert.equal(s.streak, 0);
  assert.deepEqual(s.layers, ['bass']);
  assert.equal(r.sound, null); // no punishment sound
  for (let i = 0; i < 9; i++) s = streak.recordAnswer(s, true).state;
  assert.deepEqual(s.layers, ['bass', 'melody', 'harmony']);
  s = streak.recordAnswer(s, true).state;
  assert.equal(s.layers.length, 3);
});

test('recordAnswer does not mutate the given state', () => {
  const s = { streak: 2, layers: [] };
  streak.recordAnswer(s, true);
  assert.deepEqual(s, { streak: 2, layers: [] });
});

test('the streak survives a reload through the injected storage', () => {
  const store = memoryStorage();
  let s = streak.initialStreak();
  for (let i = 0; i < 4; i++) s = streak.recordAnswer(s, true).state;
  assert.equal(streak.saveStreak(store, s), true);
  assert.deepEqual(streak.loadStreak(store), { streak: 4, layers: ['bass'] });
  store.setItem(streak.STORAGE_KEY, '{broken');
  assert.deepEqual(streak.loadStreak(store), streak.initialStreak());
  assert.deepEqual(streak.loadStreak(null), streak.initialStreak());
});


test('every times-table instrument has a research source or TODO', () => {
  const ttg = require('../src/components/TimesTableGroove');
  const data = require('../src/lib/instruments.js');
  const ids = ['tabla'].concat(ttg.INSTRUMENTS);
  assert.ok(ttg.INSTRUMENTS.length > 0);
  for (const id of ids) {
    const x = data.instrumentById(id);
    assert.ok(x, id + ' is missing from instruments.js');
    const src = typeof x.source === 'string' ? x.source.trim() : '';
    assert.ok(src === 'TODO' || /^https?:\/\/\S+$/.test(src), id + ' needs a source URL or TODO, got ' + JSON.stringify(x.source));
  }
});