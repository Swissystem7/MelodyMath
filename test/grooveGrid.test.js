// #591 GrooveGrid (spec 6420777497 + correction 6420822774): area and
// perimeter as a sequencer grid, grade ה׳, as the areaScore way.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const GG = require('../src/lib/music/grooveGrid.js');
const SCREEN = require('../src/components/GrooveGridScreen.js');
const MI = require('../src/lib/myInstrument.js');
const PROG = require('../src/lib/curriculum/progression.js');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

function mem(init) {
  const m = Object.assign({}, init);
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } };
}
const voice = (r) => (r === 0 ? 'kid' : 'partner');

test('gridArea(4,6) is 24 and perimeterPath(4,6) has 20 steps around the edge', () => {
  assert.equal(GG.gridArea(4, 6), 24);
  assert.equal(GG.gridArea(0, 6), null);
  const p = GG.perimeterPath(4, 6);
  assert.equal(p.length, 20);
  p.forEach((s) => assert.ok(s.r === 0 || s.r === 3 || s.c === 0 || s.c === 5, 'only edge squares'));
  assert.equal(GG.perimeterPath(3, 8).length, 22);
  // composeL: two rectangles on one floor, the shared edge is not perimeter
  const l = GG.composeL({ rows: 2, cols: 3 }, { rows: 4, cols: 2 });
  assert.equal(l.area, 14);
  assert.equal(l.cells.length, 14);
  assert.equal(l.perimeter, 18);
  assert.equal(GG.composeL({ rows: 0, cols: 3 }, { rows: 1, cols: 1 }), null);
});

test('4×6 and 3×8 play the same number of sounds, but the loop lengths differ', () => {
  const a = GG.areaPlan(4, 6, voice), b = GG.areaPlan(3, 8, voice);
  assert.equal(a.length, b.length);
  assert.equal(a.reduce((n, x) => n + x.steps.length, 0), 24);
  const la = GG.perimeterPlan(4, 6, voice), lb = GG.perimeterPlan(3, 8, voice);
  assert.notEqual(la.reduce((n, x) => n + x.steps.length, 0), lb.reduce((n, x) => n + x.steps.length, 0));
  assert.ok(lb[lb.length - 1].at > la[la.length - 1].at, 'the 3×8 loop is longer');
});

test('above 12 a ten is one held sound and the ones play on woodClick', () => {
  const plan = GG.areaPlan(4, 6, voice);
  const tens = plan.filter((n) => n.held), ones = plan.filter((n) => !n.held);
  assert.equal(tens.length, 2);
  tens.forEach((t) => { assert.equal(t.steps.length, 10); assert.ok(t.dur > 0); });
  assert.equal(ones.length, 4);
  ones.forEach((o) => assert.equal(o.voice, 'woodClick'));
  assert.ok(plan.length < 24, 'never one sound per square above 12');
  // up to 12 every square sounds, row by row: equal groups, one track per row
  const small = GG.areaPlan(3, 4, voice);
  assert.equal(small.length, 12);
  assert.deepEqual(small.filter((n) => n.accent).map((n) => n.steps[0]), [0, 4, 8]);
  assert.deepEqual([...new Set(small.map((n) => n.voice))], ['kid', 'partner']);
});

test('row 0 is the child\'s instrument from myInstrument.instrumentFor; the grid has 2 families', () => {
  const kid = SCREEN.tracks(mem({ [MI.KEY]: 'oud' }));
  assert.equal(kid.kid.id, 'oud');
  assert.equal(kid.trackVoice(0), kid.kid.voice);
  assert.notEqual(kid.families[0], kid.families[1]);
  const dflt = SCREEN.tracks(mem({}));
  assert.equal(dflt.kid.id, 'djembe');
  assert.notEqual(dflt.families[0], dflt.families[1]);
  assert.match(read('src/components/GrooveGridScreen.js'), /instrumentFor\(/);
});

test('the screen: right and wrong answers, then a no-music check at the end', () => {
  let s = SCREEN.createState(0, true);
  assert.equal(s.ex.ask, 'area');
  assert.equal(SCREEN.answer(s, '11').status, 'retry');
  s = SCREEN.answer(s, '12');
  assert.equal(s.status, 'right');
  const loop = SCREEN.createState(3, true);
  assert.equal(SCREEN.answer(loop, '20').status, 'right');
  const plain = SCREEN.createState(GG.TARGETS.length, true);
  assert.equal(plain.status, 'plain');
  const end = SCREEN.renderHtml(plain, SCREEN.tracks(mem({})));
  assert.match(end, /בדיקה בלי מוזיקה/);
  assert.doesNotMatch(end, /data-tap|נגן/);
  assert.equal(SCREEN.checkPlain(plain, { 'gg-nm-1': '35', 'gg-nm-2': '24', 'gg-nm-3': '14', 'gg-nm-4': '18' }).done, true);
  // squares sound on pointerdown (data-tap), are at least 48px; no picker of its own
  const html = SCREEN.renderHtml(SCREEN.createState(0, true), SCREEN.tracks(mem({})));
  assert.equal((html.match(/class="gg-cell"[^>]*data-tap="/g) || []).length, 12);
  assert.match(html, /min-height:48px/);
  assert.doesNotMatch(html, /data-act="instrument"|teacher|מורה/);
  const off = SCREEN.renderHtml(SCREEN.createState(0, false), SCREEN.tracks(mem({})));
  assert.doesNotMatch(off, /data-tap=/, 'music off: solvable with no sound');
});

test('GrooveGrid is areaScore: areaScore stays the MAIN area way, GrooveGrid adds no primary way', () => {
  assert.equal(GG.WAY, 'areaScore');
  const g3 = require('../src/lib/curriculum/grade3.js'), g5 = require('../src/lib/curriculum/grade5.js');
  const main = (ways) => ways.find((w) => !(w[4] && w[4].optional));
  assert.equal(main(g3.music.AREA)[0], 'areaScore');
  assert.equal(main(g5.music.TRI_AREA)[0], 'areaScore');
  assert.equal(main(g5.music.PARA_AREA)[0], 'areaScore');
  [1, 2, 3, 4, 5, 6].forEach((g) => {
    const m = require('../src/lib/curriculum/grade' + g + '.js').music || {};
    Object.keys(m).forEach((k) => m[k].forEach((w) => assert.notEqual(w[0], 'grooveGrid', g + ':' + k)));
  });
});

test('reachable: progression maps mm-cur-47 to the card, which sits in the music games tab with its scripts', () => {
  assert.equal(PROG.screenForTopic('mm-cur-47'), 'ggCard');
  assert.equal(PROG.screenForTopic('mm-cur-0'), null);
  const html = read('index.html');
  assert.match(html, /<section id="musicGames" [^>]*>[\s\S]*id="ggCard"[\s\S]*<!-- #591 music games end -->/);
  assert.match(html, /src="src\/lib\/curriculum\/progression\.js"[\s\S]*src="src\/lib\/music\/grooveGrid\.js"[\s\S]*src="src\/components\/GrooveGridScreen\.js"/);
  assert.match(html, /MM_PROGRESSION\.screenForTopic\(q\.get\('topic'\)\)/);
  ['progression.js', 'grooveGrid.js', 'GrooveGridScreen.js'].forEach((f) => assert.ok(read('sw.js').includes(f + "'"), f));
  const e2e = read('e2e/grooveGrid.spec.js');
  assert.match(e2e, /#tab-musicGames/);
  assert.match(e2e, /playArea/);
  assert.match(e2e, /בדיקה בלי מוזיקה/);
});
