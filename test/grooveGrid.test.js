// #591 GrooveGrid: areaScore sequencer. Above 12 a product plays row by row
// (Refs #665), so 4×6 and 3×8 do not sound the same.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const GG = require('../src/lib/music/grooveGrid.js');
const SCREEN = require('../src/components/GrooveGridScreen.js');
const MI = require('../src/lib/myInstrument.js');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

function mem(init) {
  const m = Object.assign({}, init);
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } };
}
const voice = (r) => (r === 0 ? 'kid' : 'partner');
const accents = (p) => p.filter((n) => n.accent);

test('gridArea, perimeter and the L', () => {
  assert.equal(GG.gridArea(4, 6), 24);
  assert.equal(GG.gridArea(0, 6), null);
  const p = GG.perimeterPath(4, 6);
  assert.equal(p.length, 20);
  p.forEach((s) => assert.ok(s.r === 0 || s.r === 3 || s.c === 0 || s.c === 5));
  assert.equal(GG.perimeterPath(3, 8).length, 22);
  const l = GG.composeL({ rows: 2, cols: 3 }, { rows: 4, cols: 2 });
  assert.equal(l.area, 14);
  assert.equal(l.cells.length, 14);
  assert.equal(l.perimeter, 18);
  assert.equal(GG.composeL({ rows: 0, cols: 3 }, { rows: 1, cols: 1 }), null);
});

test('above 12 a product is one row phrase per row, so 4×6 and 3×8 differ', () => {
  const a = GG.areaPlan(4, 6, voice), b = GG.areaPlan(3, 8, voice);
  assert.deepEqual(accents(a).map((n) => n.steps.length), [6, 6, 6, 6]);
  assert.deepEqual(accents(b).map((n) => n.steps.length), [8, 8, 8]);
  assert.notDeepEqual(a.map((n) => [n.at, n.voice, !!n.held]), b.map((n) => [n.at, n.voice, !!n.held]));
  accents(a).forEach((n, i) => {
    const clicks = a.filter((x) => x.row === i && !x.held);
    assert.equal(clicks.length, 6);
    clicks.forEach((c) => { assert.equal(c.voice, 'woodClick'); assert.ok(c.at >= n.at && c.at < n.at + n.dur); });
    if (i) assert.ok(n.at >= accents(a)[i - 1].at + accents(a)[i - 1].dur);
  });
  assert.deepEqual(accents(a).map((n) => n.voice), ['kid', 'partner', 'partner', 'partner']);
  assert.notDeepEqual(accents(GG.areaPlan(2, 12, voice)).map((n) => n.steps.length), accents(GG.areaPlan(12, 2, voice)).map((n) => n.steps.length));
  const small = GG.areaPlan(3, 4, voice);
  assert.equal(small.length, 12);
  assert.deepEqual(accents(small).map((n) => n.steps[0]), [0, 4, 8]);
  assert.ok(accents(a).length < 24);
});

test('perimeter above 12 stays tens and ones, and the 3×8 loop is longer', () => {
  const la = GG.perimeterPlan(4, 6, voice), lb = GG.perimeterPlan(3, 8, voice);
  assert.equal(la.filter((n) => n.held).length, 2);
  assert.equal(la.filter((n) => !n.held).length, 0);
  assert.equal(lb.filter((n) => !n.held).length, 2);
  lb.filter((n) => !n.held).forEach((o) => assert.equal(o.voice, 'woodClick'));
  assert.ok(lb[lb.length - 1].at > la[la.length - 1].at);
});

function passes(voiceId, hz) {
  const f = require('../src/lib/instrumentVoices.js').VOICES[voiceId].filter;
  if (!f) return 1;
  const x = hz / f[1], den = Math.sqrt((1 - x * x) ** 2 + x * x);
  return f[0] === 'lowpass' ? 1 / den : f[0] === 'highpass' ? (x * x) / den : x / den;
}

test('row notes and loop notes stay audible through the voice filter', () => {
  assert.ok(passes('drumHigh', 110) < 0.1);
  const tr = SCREEN.tracks(mem({}));
  GG.areaPlan(4, 6, tr.trackVoice).concat(GG.perimeterPlan(3, 8, tr.trackVoice)).forEach((n) => {
    assert.ok(n.hz >= GG.MIN_HZ, n.hz);
    assert.ok(passes(n.voice, n.hz) >= 0.5, n.voice + ' ' + n.hz);
  });
  const row0 = accents(GG.areaPlan(4, 6, tr.trackVoice))[0];
  assert.equal(row0.voice, 'drumHigh');
  assert.ok(row0.hz >= 1250);
});

test('row 0 is the child instrument and the grid has 2 families', () => {
  const kid = SCREEN.tracks(mem({ [MI.KEY]: 'oud' }));
  assert.equal(kid.kid.id, 'oud');
  assert.equal(kid.trackVoice(0), kid.kid.voice);
  assert.notEqual(kid.families[0], kid.families[1]);
  const dflt = SCREEN.tracks(mem({}));
  assert.equal(dflt.kid.id, 'djembe');
  assert.notEqual(dflt.families[0], dflt.families[1]);
  assert.match(read('src/components/GrooveGridScreen.js'), /instrumentFor\(/);
});

test('the screen answers, then a no-music check', () => {
  let s = SCREEN.createState(0, true);
  assert.equal(SCREEN.answer(s, '11').status, 'retry');
  assert.equal(SCREEN.answer(s, '12').status, 'right');
  assert.equal(SCREEN.answer(SCREEN.createState(3, true), '20').status, 'right');
  const plain = SCREEN.createState(GG.TARGETS.length, true);
  const end = SCREEN.renderHtml(plain, SCREEN.tracks(mem({})));
  assert.match(end, /בדיקה בלי מוזיקה/);
  assert.doesNotMatch(end, /data-tap|נגן/);
  assert.equal(SCREEN.checkPlain(plain, { 'gg-nm-1': '35', 'gg-nm-2': '24', 'gg-nm-3': '14', 'gg-nm-4': '18' }).done, true);
  const html = SCREEN.renderHtml(SCREEN.createState(0, true), SCREEN.tracks(mem({})));
  assert.equal((html.match(/class="gg-cell"[^>]*data-tap="/g) || []).length, 12);
  assert.match(html, /min-height:48px/);
  assert.doesNotMatch(html, /data-act="instrument"|teacher|מורה/);
  assert.doesNotMatch(SCREEN.renderHtml(SCREEN.createState(0, false), SCREEN.tracks(mem({}))), /data-tap=/);
});

test('areaScore stays the MAIN area way and nothing is named grooveGrid', () => {
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

test('the card is in the music games tab and ?topic=mm-cur-47 opens it', () => {
  assert.equal(GG.SCREEN_FOR['mm-cur-47'], 'ggCard');
  const html = read('index.html');
  assert.match(html, /<section id="musicGames" [^>]*>[\s\S]*id="ggCard"[\s\S]*<!-- #591 music games end -->/);
  assert.match(html, /src="src\/lib\/music\/grooveGrid\.js"[\s\S]*src="src\/components\/GrooveGridScreen\.js"/);
  assert.match(html, /SCREEN_FOR\[q\.get\('topic'\)\]/);
  ['grooveGrid.js', 'GrooveGridScreen.js'].forEach((f) => assert.ok(read('sw.js').includes(f + "'"), f));
});
