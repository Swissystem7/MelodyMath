// MelodyMath — LoopStack (#591): box volume as stacked loop layers, grade ו׳.
// It continues cubeLayerGroups from ד׳ (same name, same sound) and is wired
// to a real card in the music games tab.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const LS = require('../src/lib/music/loopStack.js');
const S = require('../src/components/LoopStackScreen.js');
const g2 = require('../src/lib/grade2Music.js');
const banks = require('../src/lib/banks.js');
const g6 = require('../src/lib/curriculum/grade6.js');
const prog = require('../src/lib/curriculum/progression.js');
const inst = require('../src/lib/instruments.js');

test('volume, layers and liters: the spec acceptance values', () => {
  assert.equal(LS.volume(3, 4, 5), 60);
  const ls = LS.layers(3, 4, 5);
  assert.equal(ls.length, 5);
  assert.ok(ls.every((l) => l.cubes === 12));
  assert.equal(LS.cm3ToLiters(1000), 1);
  assert.equal(LS.volume(0, 4, 5), null);
  assert.deepEqual(LS.layers(3, 4, 0), []);
});

test('the base loop is the a×b grid, row after row (the areaScore grid)', () => {
  const cells = LS.baseLoop(3, 4);
  assert.equal(cells.length, 12);
  assert.deepEqual(cells.slice(0, 5), [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }, { r: 1, c: 0 }]);
});

test('a layer sounds like cubeLayerGroups: one beat per cube up to 12, tens and ones above', () => {
  const small = LS.layerNotes(12, 'drumLow', 0, 0);
  assert.equal(small.length, 12);
  assert.ok(small.every((n) => n.place === 'unit' && n.voice === 'drumLow'));
  const big = LS.layerNotes(24, 'drumLow', 0, 0);
  const s = g2.cubeLayerSounds(24);
  assert.equal(big.filter((n) => n.place === 'ten').length, s.tens);
  assert.ok(big.filter((n) => n.place === 'ten').every((n) => n.held && n.dur > 0));
  assert.ok(big.filter((n) => n.place === 'one').every((n) => n.voice === 'woodClick'));
  assert.equal(big.length, 6, 'never one sound per cube above 12');
  assert.equal(LS.layerNotes(20, 'drumLow', 0, 0).length, 2);
});

test('the stack plays c equal groups, layer 1 on the child instrument, others on 2+ families', () => {
  const plan = LS.stackPlan(3, 4, 5, (i) => 'v' + i);
  assert.equal(plan.length, 60);
  for (let i = 0; i < 5; i++) assert.equal(plan.filter((n) => n.layer === i).length, 12);
  assert.ok(plan.filter((n) => n.layer === 0).every((n) => n.voice === 'v0'));
  for (let k = 1; k < plan.length; k++) assert.ok(plan[k].at > plan[k - 1].at);
  const ids = LS.layerInstruments(4, 'darbuka', 'percussion');
  assert.equal(ids[0], 'darbuka');
  const fams = new Set(ids.map((id) => inst.instrumentById(id).family));
  assert.ok(fams.size >= 2, [...fams].join());
  assert.ok(!ids.slice(1).some((id) => inst.instrumentById(id).family === 'percussion'));
  assert.ok(!ids.includes('ukulele'), 'ukulele is for fractions only');
  assert.match(fs.readFileSync(require.resolve('../src/components/LoopStackScreen.js'), 'utf8'), /MINE\.instrumentFor\(/);
});

test('cubeLayerGroups stays MAIN: ד׳ cube items and ו׳ box-volume items', () => {
  assert.deepEqual(banks.primaryWays(g6.music.G6_BOX_VOL).map((w) => w[0]), ['cubeLayerGroups']);
  assert.ok(g6.music.G6_BOX_VOL.some((w) => w[0] === 'layerByLayer' && banks.isOptionalWay(w)), 'layerByLayer kept as EXTRA');
  assert.equal(LS.WAY, 'cubeLayerGroups');
  const box = banks.itemsForGrade('ו').filter((it) => it.standard === banks.ST.G6_BOX_VOL);
  assert.ok(box.length >= 6);
  box.forEach((it) => assert.equal(it.music, 'cubeLayerGroups', it.prompt));
  const cube = banks.itemsForGrade('ד').filter((it) => it.standard === banks.ST.MASS_VOL && /תיבה|קובי/.test(it.prompt));
  assert.ok(cube.length && cube.every((it) => it.music === 'cubeLayerGroups'));
});

test('the screen: answer the volume, then a no-music check with no sound buttons', () => {
  let st = S.createState(0, true);
  const ex = st.ex;
  assert.equal(S.check(st, '1').status, 'wrong');
  st = S.check(st, String(LS.volume(ex.a, ex.b, ex.c)));
  assert.equal(st.status, 'right');
  const html = S.renderHtml(S.createState(0, true), ['מרימבה', 'קורה']);
  assert.match(html, /data-act="play"/);
  assert.equal((html.match(/class="ls-layer"/g) || []).length, ex.c);
  assert.doesNotMatch(S.renderHtml(S.createState(0, false), []), /data-act="play"/);
  const plain = S.createState(LS.TARGETS.length, true);
  const ph = S.renderHtml(plain, []);
  assert.match(ph, /בדיקה בלי מוזיקה/);
  assert.doesNotMatch(ph, /data-tap|data-act="play"/);
  const answers = {};
  LS.NO_MUSIC_CHECK_ITEMS.forEach((it) => { answers[it.id] = String(it.answer); });
  assert.match(S.checkPlain(plain, answers).message, /^3 מתוך 3/);
});

test('LoopStack is reachable: card in the music games tab, scripts, router, precache', () => {
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  assert.match(html, /id="musicGames"[\s\S]*id="lsCard"[\s\S]*#591 music games end/);
  assert.match(html, /grade2Music\.js[\s\S]*progression\.js[\s\S]*loopStack\.js[\s\S]*LoopStackScreen\.js/);
  assert.match(html, /MM_PROGRESSION\.screenForTopic/);
  assert.equal(prog.screenForTopic('mm-cur-56'), 'lsCard');
  assert.equal(prog.linksForTopic('mm-cur-56').carries, 'volume');
  assert.ok(prog.linksForTopic('mm-cur-56').prereq.includes('mm-cur-20'), 'builds on the ב׳ cube layers');
  assert.equal(prog.screenForTopic('nope'), null);
  const sw = fs.readFileSync(require.resolve('../sw.js'), 'utf8');
  ['loopStack.js', 'LoopStackScreen.js', 'progression.js'].forEach((f) => assert.ok(sw.includes(f), f));
});
