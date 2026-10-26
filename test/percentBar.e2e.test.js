// Grade ו׳ percent bar on the practice item (Refs #682, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const PM = require('../src/lib/music/percentMix.js');
const I = require('../src/lib/instruments.js');
const banks = require('../src/lib/banks.js');

function memoryStorage(seed) {
  const data = Object.assign({}, seed);
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, removeItem: (k) => { delete data[k]; } };
}

test('a grade ו PERCENT item renders the bar and play() schedules one sound per circle', () => {
  const it = banks.allItems().find((i) => i.grade === 'ו' && i.music === 'percentBar');
  const spec = PM.specForItem(it);
  assert.equal(spec.kind, 'percentBar');
  const html = PM.circlesHtml(spec);
  assert.match(html, /percent-bar/);
  assert.match(html, /data-tap=/);
  const scheduled = [];
  const jam = { playNotes: (notes) => { scheduled.push(...notes); return { stop() {} }; } };
  PM.play(spec, { jam: jam });
  assert.equal((html.match(/snd-dot/g) || []).length, scheduled.length);
  assert.equal(scheduled.length, spec.circles);
});

test('splits 4/10/20: circles equal sounds, and the sounds use two families from instrumentFor', () => {
  const storage = memoryStorage({ 'mm.myInstrument': 'piano' });
  assert.equal(PM.familyVoices(storage).id, 'piano');
  [4, 10, 20].forEach((split) => {
    const spec = PM.specForItem({ music: 'percentBar', prompt: '100%', split: split });
    const notes = [];
    PM.play(spec, { jam: { playNotes: (n) => { notes.push(...n); return { stop() {} }; } }, storage: storage });
    assert.equal((PM.circlesHtml(spec, storage).match(/snd-dot/g) || []).length, notes.length);
    assert.equal(notes.length, split);
    const families = new Set(notes.map((n) => I.INSTRUMENTS.find((x) => x.voice === n.voice).family));
    assert.ok(families.has('keys') && families.has('percussion'), 'split ' + split);
    assert.ok(notes.some((n) => n.voice === 'keys' && n.hz));
    assert.ok(notes.some((n) => n.voice === 'drumLow' && !n.hz));
    notes.forEach((n, i) => {
      const accent = i % PM.groupBeats(split) === 0;
      assert.equal(n.voice, accent ? 'keys' : 'drumLow', 'split ' + split + ' beat ' + i);
    });
    assert.equal(notes[1].voice, notes[2].voice);
  });
});

test('one circle (25% of 4, 10% of 10) plays the melody with the drum', () => {
  const storage = memoryStorage({ 'mm.myInstrument': 'piano' });
  [[25, 4], [10, 10]].forEach(([percent, split]) => {
    const spec = PM.specForItem({ music: 'percentBar', prompt: percent + '%', split: split });
    assert.equal(spec.circles, 1);
    const html = PM.circlesHtml(spec, storage);
    assert.equal((html.match(/snd-dot/g) || []).length, 1);
    assert.match(html, /data-tap="keys"/);
    const notes = [];
    PM.play(spec, { jam: { playNotes: (n) => { notes.push(...n); return { stop() {} }; } }, storage: storage });
    assert.equal(notes.length, 2);
    assert.equal(notes[0].at, notes[1].at);
    const families = new Set(notes.map((n) => I.INSTRUMENTS.find((x) => x.voice === n.voice).family));
    assert.ok(families.has('keys') && families.has('percussion'), percent + '% of ' + split);
    assert.ok(notes.some((n) => n.voice === 'keys' && n.hz === PM.TEN_STEPS_HZ[0]));
    assert.ok(notes.some((n) => n.voice === 'drumLow' && !n.hz));
  });
});
