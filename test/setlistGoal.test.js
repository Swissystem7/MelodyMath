'use strict';
// SetlistGoal (Refs #591): a small goal for today (Bandura & Schunk 1981), built as a song.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const G = require('../src/lib/setlistGoal');
const streak = require('../src/lib/streak');

function mockStorage() {
  const store = new Map();
  return { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
}
const met = (goal) => ({ goal, met: true });
const missed = (goal) => ({ goal, met: false });

test('three sizes the child picks from: 4, 8 and 12', () => {
  assert.deepEqual(G.GOALS.map((g) => g.size), [4, 8, 12]);
  assert.deepEqual(G.GOALS.map((g) => g.he), ['שיר קצר', 'שיר', 'שיר ארוך']);
});

test('suggestNextGoal: two met → next size, two missed → previous, otherwise the same', () => {
  assert.equal(G.suggestNextGoal([]), 'short');
  assert.equal(G.suggestNextGoal([met('short')]), 'short');
  assert.equal(G.suggestNextGoal([met('short'), met('short')]), 'song');
  assert.equal(G.suggestNextGoal([met('song'), met('song')]), 'long');
  assert.equal(G.suggestNextGoal([met('long'), met('long')]), 'long');
  assert.equal(G.suggestNextGoal([missed('long'), missed('long')]), 'song');
  assert.equal(G.suggestNextGoal([missed('short'), missed('short')]), 'short');
  assert.equal(G.suggestNextGoal([met('song'), missed('song')]), 'song');
  // Two met of different sizes are not "two in a row" at one size.
  assert.equal(G.suggestNextGoal([met('short'), met('song')]), 'song');
});

test('progress counts only right answers; the 4th right answer meets "שיר קצר"', () => {
  G.setStorage(mockStorage());
  G.start('short', { day: '2026-10-26', instrument: 'piano' });
  assert.equal(G.recordAnswer(false).counted, false);
  for (let i = 1; i <= 3; i++) {
    const r = G.recordAnswer(true);
    assert.equal(r.active.count, i);
    assert.equal(r.justMet, false);
  }
  assert.equal(G.recordAnswer(false).active.count, 3);
  const r = G.recordAnswer(true);
  assert.equal(r.justMet, true);
  assert.equal(r.song.met, true);
  assert.equal(G.getActive(), null);
  assert.equal(G.recordAnswer(true).counted, false);
  const song = G.songPhrase(r.song);
  assert.equal(song.notes.length, 4);
  assert.equal(song.instrument, 'piano');
  assert.equal(song.notes[song.notes.length - 1], 261.63);
});

test('a missed goal is saved as it is, and the next day starts fresh', () => {
  G.setStorage(mockStorage());
  G.start('song', { day: '2026-10-25' });
  G.recordAnswer(true); G.recordAnswer(true);
  assert.equal(G.rollover('2026-10-26'), null);
  const h = G.getHistory();
  assert.equal(h.length, 1);
  assert.deepEqual([h[0].goal, h[0].count, h[0].met], ['song', 2, false]);
  assert.equal(G.songPhrase(h[0]).notes.length, 2);
});

test('only an answer in a step with music adds a box; the no-music check does not (#665)', () => {
  G.setStorage(mockStorage());
  G.start('short', { day: '2026-10-26' });
  [{ noMusic: true, musicStage: 'no_music_check' }, { plain: true }, { stage: 'plain' }, { musicStage: 'no_music_check' }]
    .forEach((item) => assert.equal(G.recordAnswer(true, { item }).counted, false, JSON.stringify(item)));
  assert.equal(G.getActive().count, 0);
  assert.equal(G.recordAnswer(true, { item: { prompt: '3 + 4', hear: [3, 4] } }).active.count, 1);
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.match(html, /setlistNote\(correct,topic,won,item,quiet\)/);
  assert.match(html, /recordAnswer\(correct,\{item:item,/);
});

test('the day turns over at midnight in Israel (IDT +3, IST +2), not in UTC', () => {
  assert.equal(G.dayKey('2026-07-14T20:59:00Z'), '2026-07-14');
  assert.equal(G.dayKey('2026-07-14T21:30:00Z'), '2026-07-15');
  assert.equal(G.dayKey('2026-12-01T21:30:00Z'), '2026-12-01');
  assert.equal(G.dayKey('2026-12-01T22:30:00Z'), '2026-12-02'); // UTC still says 12-01
  G.setStorage(mockStorage());
  G.start('song', { day: G.dayKey('2026-12-01T21:30:00Z') });
  G.recordAnswer(true);
  assert.notEqual(G.rollover(G.dayKey('2026-12-01T21:59:00Z')), null);
  assert.equal(G.rollover(G.dayKey('2026-12-01T22:01:00Z')), null);
  assert.equal(G.getHistory()[0].count, 1);
});

test('saved goals survive a reload through storage', () => {
  const s = mockStorage();
  G.setStorage(s);
  G.start('long', { day: '2026-10-26' });
  G.recordAnswer(true);
  G.setStorage(s);
  assert.equal(G.getActive().count, 1);
  assert.equal(G.getActive().target, 12);
});

test('every song note is in the C-major pentatonic, within one octave (no stray sound)', () => {
  const ok = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
  assert.equal(G.MELODY.length, 12);
  G.MELODY.forEach((hz) => assert.ok(ok.includes(hz), String(hz)));
  ['short', 'song', 'long'].forEach((id) => {
    const g = G.GOALS.find((x) => x.id === id);
    const p = G.songPhrase({ goal: id, target: g.size, count: g.size });
    assert.equal(p.notes.length, g.size);
    assert.equal(p.notes[p.notes.length - 1], 261.63);
  });
});

test('no failure wording, no timer, no points in the module', () => {
  const src = fs.readFileSync(path.join(__dirname, '../src/lib/setlistGoal.js'), 'utf8');
  assert.doesNotMatch(src, /נכשל|כישלון|setInterval|setTimeout|נקודות/);
});

test('streak.js API is unchanged', () => {
  assert.deepEqual(Object.keys(streak).sort(), [
    'PHRASES', 'STREAK_TARGET', 'getStreak', 'getUnlocks', 'instrumentFor', 'mySong', 'mySongHtml',
    'playPhrase', 'playSong', 'recordAnswer', 'resetAll', 'setStorage', 'softReset', 'voiceFor',
  ]);
});

test('index.html loads the module, has one goal bar and is cached offline', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
  assert.equal((html.match(/src="src\/lib\/setlistGoal\.js"/g) || []).length, 1);
  assert.equal((html.match(/id="setlistGoal"/g) || []).length, 1);
  assert.ok(html.indexOf('src/lib/streak.js') < html.indexOf('src/lib/setlistGoal.js'));
  assert.match(sw, /'\.\/src\/lib\/setlistGoal\.js'/);
  assert.doesNotMatch(html, /^(<<<<<<<|>>>>>>>|=======$)/m);
});
