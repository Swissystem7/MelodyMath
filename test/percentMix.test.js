// MelodyMath — Unit tests for PercentMix, its screen & DataBeats (#682, Refs #665, Refs #591).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const PM = require('../src/lib/music/percentMix.js');
const DB = require('../src/lib/music/dataBeats.js');
const P = require('../src/components/PercentMixPad.js');
const I = require('../src/lib/instruments.js');
const banks = require('../src/lib/banks.js');
const g6 = require('../src/lib/curriculum/grade6.js');

test('Unit: the shortest emitted note is ≥ 80ms', () => {
  const notes = PM.barPlan(['half', 'beat', 'ten', 'five', 'one'], 180, 'drumLow', 10).concat(DB.sonifySeries([5, 10], { bpm: 200 }).notes);
  assert.ok(notes.length > 0);
  notes.forEach((n) => assert.ok(n.durMs >= 80 && n.dur >= 0.08, n.kind + ' ' + n.durMs));
});

test('Unit: the default split is in {4, 10, 20}', () => {
  [PM.DEFAULT_SPLIT, PM.TEACHER_METADATA.defaultSplit, ...PM.TEACHER_METADATA.splits].forEach((s) => assert.ok([4, 10, 20].includes(s)));
});

test('Unit: the metadata has evidence + buildsFrom/buildsTo; the bar is the main method, not experimental', () => {
  const m = PM.TEACHER_METADATA;
  assert.deepEqual([m.evidence, m.primary.evidence, m.optional, m.mechanism, m.buildsTo, m.doi], ['strong', 'strong', false, 'M3', 'ratio', '10.1023/B:EDUC.0000005212.03219.dc']);
  assert.deepEqual([...m.buildsFrom], ['fractions', 'decimals']);
});

test('Primary method: one bar = 100%, split into 4/10/20 beats', () => {
  const b25 = PM.percentBar(25);
  assert.deepEqual([b25.percent, b25.decimal, b25.fraction, b25.beats, b25.totalBeats], [25, 0.25, '1/4', 2.5, 10]);
  assert.equal(b25 == 0.25, true);
  [[50, '1/2'], [10, '1/10'], [75, '3/4']].forEach(([p, f]) => assert.equal(PM.percentBar(p).fraction, f));
  [[25, 4, 1], [50, 20, 10]].forEach(([p, s, b]) => assert.deepEqual([PM.percentBar(p, s).beats, PM.percentBar(p, s).totalBeats], [b, s]));
});

test('100 sub-beats remain an optional add-on only, evidence: experimental', () => {
  const a = PM.percentToSubbeats(25);
  assert.deepEqual([a.optional, a.evidence, a.addon, a.subbeats, a.of, a.fraction, a.decimal], [true, 'experimental', true, 25, 100, '1/4', 0.25]);
  const m = PM.TEACHER_METADATA.addon;
  assert.deepEqual([m.optional, m.evidence, m.subbeats], [true, 'experimental', 100]);
});

test('Tiles are 50/25/10; 5 and 1 are hidden', () => {
  [['five', true], ['one', true], ['half', undefined], ['beat', undefined], ['ten', undefined]].forEach(([id, h]) => assert.equal(PM.tile(id).hidden, h, id));
  assert.deepEqual(PM.VISIBLE_TILES.map((t) => t.n), [50, 25, 10]);
  let res = PM.addTile(PM.addTile([], 'half', 75).fill, 'beat', 75);
  assert.deepEqual([res.accepted, res.fill, PM.checkFill(res.fill, 75).status], [true, ['half', 'beat'], 'exact']);
  res = PM.addTile(res.fill, 'ten', 75);
  assert.deepEqual([res.accepted, res.status], [false, 'over']);
});

test('One 25% tile: quarter and beat are the same tile and it keeps both sounds', () => {
  assert.equal(PM.TILES.filter((t) => t.n === 25).length, 1);
  assert.equal(PM.tile('beat'), PM.tile('quarter'));
  assert.deepEqual(PM.tile('quarter').voices, ['drumLow', 'woodClick']);
  PM.TARGETS.forEach((t) => assert.ok(!t.allowed.includes('beat'), 'one 25% button per exercise'));
  const plan = PM.barPlan(['quarter'], 90, 'drumLow', 4).map((n) => n.kind + ':' + n.voice);
  assert.ok(plan.includes('tile:drumLow') && plan.includes('tileBeat:woodClick'), 'quarter drum stroke + beat wood click');
  assert.equal(PM.filled(['quarter', 'beat']), 50);
});

test('The beat label follows the chosen split (4/10/20)', () => {
  [['quarter', 4, '25% = פעמה מתוך 4'], ['quarter', 10, '25% = 2.5 פעמות מתוך 10'], ['quarter', 20, '25% = 5 פעמות מתוך 20'],
    ['ten', 10, '10% = פעמה מתוך 10'], ['half', 4, '50% = 2 פעמות מתוך 4']].forEach(([id, s, he]) => assert.equal(PM.tileLabel(id, s), he));
});

test('DataBeats adds an accent every 5 taps and cites real sources', () => {
  const s = DB.sonifySeries([12]);
  assert.equal(s.notes.length, 12);
  s.notes.forEach((n) => assert.equal(n.accent, n.n === 5 || n.n === 10, 'tap ' + n.n));
  assert.deepEqual([DB.mean([2, 4, 6, 8]), DB.range([3, 8, 5, 6])], [5, { min: 3, max: 8, range: 5 }]);
  assert.deepEqual([[2, 4, 6, 8], [9, 7, 5, 3], [5, 5, 6, 4]].map(DB.trend), ['up', 'down', 'flat']);
  assert.deepEqual(DB.SOURCES, { M1: 'mcdonel2015', M2: 'das2023' });
  Object.values(DB.SOURCES).forEach((id) => assert.match(banks.MUSIC_SOURCES[id][1], /^https:\/\/doi\.org\//));
});

test('Plus the no-music percent check (see the shared issue)', () => {
  assert.ok(PM.getNoMusicCheck() === PM.NO_MUSIC_CHECK_ITEMS[0] && PM.NO_MUSIC_CHECK_ITEMS.length >= 3);
  PM.NO_MUSIC_CHECK_ITEMS.forEach((it) => {
    assert.deepEqual([it.grade, it.skill, it.noMusic, it.plain, it.musicStage], ['ו', 'percent', true, true, 'no_music_check']);
    assert.ok(it.prompt.length > 0 && it.answer != null);
  });
});

test('PercentMixPad screen: mounted card, split buttons, tiles, no-music check at the end', () => {
  assert.match(fs.readFileSync(require.resolve('../index.html'), 'utf8'), /id="pmCard"[\s\S]*src\/components\/PercentMixPad\.js/);
  assert.match(fs.readFileSync(require.resolve('../sw.js'), 'utf8'), /PercentMixPad\.js/);
  let s = P.createState(0, true, 4);
  assert.match(P.renderHtml(s, 'drumLow'), /data-split="20"[\s\S]*25% = פעמה מתוך 4/);
  assert.equal(P.tapTile(s, 'quarter').status, 'exact');
  assert.equal(P.check(P.tapTile(P.createState(1, true), 'ten')).message, 'חסרים 40%. הוסיפו אריח.');
  s = P.createState(PM.TARGETS.length, true);
  assert.ok(s.status === 'plain' && /בדיקה בלי מוזיקה/.test(P.renderHtml(s, 'drumLow')));
  assert.equal(P.checkPlain(s, { 'percent-nm-1': '25', 'percent-nm-2': '40', 'percent-nm-3': 'עשירית' }).message, '3 מתוך 3 נכונות.');
});

test('grade6 PERCENT: the percent bar is the single main way (M3)', () => {
  assert.deepEqual(banks.primaryWays(g6.music.PERCENT).map((w) => w[0]), ['percentBar']);
  assert.deepEqual(g6.music.PERCENT.map((w) => w[0]), ['percentBar', 'sectionsFillBar', 'hundredBar', 'partOfHundredBar']);
  assert.equal(banks.mechanismOf('percentBar'), 'M3');
  const g4 = require('../src/lib/curriculum/grade4.js');
  assert.ok(g4.music.MASS_VOL.some((w) => w[0] === 'cubeLayerGroups') && g6.music.G6_COMP_TRI.some((w) => w[0] === 'areaScore'));
});

test('Instruments registry binds cajon to data (M1) and darbuka to percent (M3)', () => {
  assert.deepEqual([I.TOPICS.data.mechanism, I.TOPICS.percent.mechanism], ['M1', 'M3']);
  assert.ok(I.forTopic('data').some((x) => x.id === 'cajon') && I.forTopic('percent').some((x) => x.id === 'darbuka'));
});

test('a grade ו PERCENT item shows one circle per beat (splits 4/10/20)', () => {
  assert.equal(PM.specForItem(banks.allItems().find((i) => i.grade === 'ו' && i.music === 'percentBar')).kind, 'percentBar');
  assert.equal(PM.specForItem({ music: 'hundredBar', prompt: '50%' }), null);
  [4, 10, 20].forEach((split) => {
    const spec = PM.specForItem({ music: 'percentBar', prompt: '100%', split: split }), scheduled = [];
    PM.play(spec, { jam: { playNotes: (notes) => { scheduled.push(...notes); return { stop() {} }; } } });
    assert.equal((PM.circlesHtml(spec).match(/snd-dot/g) || []).length, scheduled.length);
    assert.equal(scheduled.length, split);
  });
});
