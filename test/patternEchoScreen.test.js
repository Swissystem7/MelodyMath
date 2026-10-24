// #591 proposal 4/5: the PatternEcho screen (M6 melodic and rhythmic patterns).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PE = require('../src/components/PatternEcho.js');
const IL = require('../src/lib/music/interleave.js');
const INST = require('../src/lib/instruments.js');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

function find(type, rule) {
  for (let r = 0; r < PE.ROUNDS.length; r++) for (let p = 0; p < PE.ROUNDS[r].length; p++) {
    const it = PE.ROUNDS[r][p];
    if (it.type === type && it.rule === rule) return PE.createState(r, p);
  }
  return null;
}

test('every round of 6 mixes at least 2 pattern types, and every item is M6', () => {
  assert.ok(PE.ROUNDS.length >= 2);
  PE.ROUNDS.forEach((r) => {
    assert.equal(r.length, 6);
    assert.ok(IL.typesIn(r) >= 2);
  });
  PE.ITEMS.forEach((it) => assert.equal(find(it.type, it.rule).pattern.mechanism, 'M6'));
});

test('grow +3 asks for 15 after 3 6 9 12; a right echo completes the phrase', () => {
  const s = find('grow', '+3');
  assert.deepEqual(s.pattern.values, [3, 6, 9, 12, 15]);
  assert.ok(PE.keys(s).some((k) => k.value === 15));
  const r = PE.echo(s, 15);
  assert.equal(r.status, 'right');
  assert.match(PE.renderHtml(r), /data-idx="4">15</);
});

test('a wrong echo names the note where the rule broke and what it should be', () => {
  const s = find('repeat', 'ABB');
  const w = PE.echo(s, 1);
  assert.equal(w.status, 'wrong');
  assert.equal(w.broke, 5);
  assert.match(w.message, /האיבר ה־6 שובר את הכלל: צריך B/);
  assert.match(PE.renderHtml(w), /class="pe-note pe-v2 broke" data-idx="5"/);
  assert.equal(PE.echo(w, 2).status, 'right', 'the child can try again at once');
});

test('a mirror pattern reads the same both ways', () => {
  const s = find('mirror', 'ABCD');
  assert.deepEqual(s.pattern.values, [1, 2, 3, 4, 3, 2, 1]);
  assert.equal(PE.echo(s, 1).status, 'right');
});

test('timbres are instruments with a source or TODO, and never change the method', () => {
  PE.TIMBRES.forEach((id) => {
    const x = INST.instrumentById(id);
    assert.ok(x, id);
    assert.ok(x.source === 'TODO' || /^https:/.test(x.source), id + ' source');
    assert.ok(x.mathTopics.includes('patterns'));
  });
  const g = PE.renderHtml(Object.assign(find('repeat', 'AB'), { timbre: 'gamelan' }));
  assert.match(g, /data-tap="gong"/);
});

test('free mode continues the child\'s motif to 8 notes', () => {
  let s = PE.createState(0, 0);
  s = PE.addMotif(PE.addMotif(PE.addMotif(s, 1), 3), 3);
  s = PE.continueMotif(s);
  assert.deepEqual(s.free.values, [1, 3, 3, 1, 3, 3, 1, 3]);
  assert.equal(PE.continueMotif(PE.addMotif(PE.createState(0, 0), 2)).free, null, 'one note is not a pattern');
});

test('with music the keys are pitched bars on pointerdown; without music the same pattern is shapes and numbers', () => {
  const on = PE.renderHtml(find('repeat', 'ABB'));
  assert.match(on, /data-act="echo" data-value="1" data-tap="woodBar" data-hz="261.63"/);
  const offState = Object.assign(find('repeat', 'ABB'), { showMusic: false });
  const off = PE.renderHtml(offState);
  assert.doesNotMatch(off, /data-tap|data-act="play"/);
  assert.match(off, /●/);
  assert.match(off, /▲/);
  assert.equal(PE.echo(offState, 2).status, 'right', 'solvable with the music off');
  assert.equal(PE.hzOf(8), 523.26);
});

test('index.html mounts the PatternEcho card, its scripts are in order and precached', () => {
  assert.match(html, /<section id="musicGames" [^>]*>[\s\S]*id="peCard"[\s\S]*<!-- #591 music games end -->/);
  const at = (src) => html.indexOf('<script src="' + src + '"></script>');
  ['src/lib/music/patterns.js', 'src/lib/music/interleave.js'].forEach((s) => {
    assert.ok(at(s) > 0 && at(s) < at('src/components/PatternEcho.js'), s);
    assert.ok(sw.includes("'./" + s + "'"), s + ' precached');
  });
  assert.ok(sw.includes("'./src/components/PatternEcho.js'"));
});
