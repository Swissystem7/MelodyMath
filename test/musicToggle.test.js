'use strict';
// #591 dosage rule 5 (owner 23.10 15:54): every exercise must also be viewable
// and solvable without music, with a visible toggle on each exercise.
// Rule 6 asks for tests of rules 1, 2 and 5: rules 1 and 2 are in
// musicDosage.test.js, rule 5 is here.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const banks = require('../src/lib/banks');
const mt = require('../src/lib/musicToggle');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

test('music is on by default and the choice is kept on the device', () => {
  const s = memoryStorage();
  assert.equal(mt.loadShowMusic(s), true);
  assert.equal(mt.isMusicOff(s), false);
  mt.saveShowMusic(false, s);
  assert.equal(mt.loadShowMusic(s), false);
  assert.equal(mt.isMusicOff(s), true);
  mt.saveShowMusic(true, s);
  assert.equal(mt.loadShowMusic(s), true);
  assert.notEqual(mt.toggleLabel(true), mt.toggleLabel(false));
});

test('applyShowMusic paints every toggle and the no-music body class', () => {
  const classes = new Set();
  const buttons = [1, 2, 3].map(() => {
    const attrs = {};
    return { attrs, textContent: '', setAttribute: (k, v) => { attrs[k] = v; } };
  });
  const hear = { hidden: false, disabled: false };
  const doc = {
    body: { classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) } },
    querySelectorAll: (sel) => (sel === '[data-music-toggle]' ? buttons : []),
    getElementById: (id) => (id === 'mm-hear' ? hear : null),
  };
  assert.equal(mt.applyShowMusic(false, doc), 3);
  assert.ok(classes.has(mt.NO_MUSIC_CLASS));
  buttons.forEach((b) => {
    assert.equal(b.attrs['aria-pressed'], 'false');
    assert.equal(b.textContent, mt.toggleLabel(false));
  });
  assert.equal(hear.hidden, true);
  mt.applyShowMusic(true, doc);
  assert.ok(!classes.has(mt.NO_MUSIC_CLASS));
  buttons.forEach((b) => assert.equal(b.attrs['aria-pressed'], 'true'));
});

test('rule 5: every item of grades 1-6 can be solved without music', () => {
  const items = banks.allItems();
  assert.ok(items.length > 1000);
  const wrong = items.filter((it) => !mt.solvableWithoutMusic(it)).map((it) => it.id + ' ' + it.prompt);
  assert.deepEqual(wrong, []);
});

test('rule 5: the no-music view drops only the music, the exercise stays the same', () => {
  banks.allItems().forEach((it) => {
    const plain = mt.withoutMusic(it);
    mt.MUSIC_FIELDS.forEach((k) => assert.ok(!(k in plain), it.id + ' still has ' + k));
    assert.equal(plain.prompt, it.prompt);
    assert.equal(plain.answer, it.answer);
    assert.equal(plain.widget, it.widget);
  });
});

test('rule 5: a counted-beat cue is also on screen, as digits or a row of symbols', () => {
  const heard = banks.allItems().filter((it) => it.hear);
  assert.ok(heard.length > 0);
  heard.forEach((it) => assert.ok(mt.hearVisible(it.prompt, it.hear), it.id + ' ' + it.prompt));
  assert.deepEqual(mt.symbolRuns('🥁🥁🥁 ועוד • • •'), [3, 3]);
  assert.equal(mt.hearVisible('כמה תופים? 🥁🥁🥁🥁', [4]), true);
  assert.equal(mt.hearVisible('הקשיבו וספרו', [4]), false);
  assert.equal(mt.hearVisible('3 פעימות ועוד 2', [3, 2]), true);
});

test('rule 5: every exercise card shows the music toggle', () => {
  const cards = ['rmPrompt', 'rmPlanPrompt', 'prompt', 'classPrompt', 'beatPrompt'];
  cards.forEach((id) => {
    const at = indexHtml.search(new RegExp('<h2 (id="' + id + '" class="prompt"|class="prompt" id="' + id + '")></h2>'));
    assert.ok(at > 0, id + ' prompt not found');
    const after = indexHtml.slice(at, at + 400);
    assert.match(after, /<button type="button" class="secondary music-toggle no-print" data-music-toggle aria-pressed="true">/, id);
  });
  assert.equal((indexHtml.match(/ data-music-toggle /g) || []).length, cards.length);
  assert.match(indexHtml, /body\.mm-no-music \.music-way,body\.mm-no-music #mm-hear\{display:none!important\}/);
  assert.match(indexHtml, /<script src="src\/lib\/musicToggle\.js"><\/script>/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /'\.\/src\/lib\/musicToggle\.js'/);
});

test('rule 5: with music off nothing plays by itself', () => {
  const fn = (name) => indexHtml.match(new RegExp('^function ' + name + '\\(.*$', 'm'))[0];
  const src = [fn('showMusicNow'), fn('musicMuted'), fn('maybeHear')].join('\n');
  function run(showMusic, quiet) {
    const calls = { clicks: 0, hear: undefined };
    const sandbox = {
      loadShowMusic: () => showMusic,
      prefsNow: () => ({ quiet }),
      setActiveHear: (g) => { calls.hear = g ? Array.from(g) : g; },
      playCountClicks: () => { calls.clicks++; },
    };
    vm.runInNewContext(src + '\nmaybeHear({hear:[3,2]});', sandbox);
    return calls;
  }
  assert.deepEqual(run(true, false), { clicks: 1, hear: [3, 2] });
  assert.deepEqual(run(false, false), { clicks: 0, hear: null });
  assert.equal(run(true, true).clicks, 0);
  // rewards and the beat-mode metronome use the same gate
  assert.doesNotMatch(indexHtml, /if\(!prefsNow\(\)\.quiet\)playRhythmClicks/);
  assert.match(indexHtml, /if\(!musicMuted\(\) && !metroOn\) startMetro\(\);/);
});

test('rule 5: the music widgets of grades 1-3 are silent with music off', () => {
  ['grade1Music', 'grade2Music', 'grade3Music'].forEach((f) => {
    const s = fs.readFileSync(path.join(root, 'src', 'lib', f + '.js'), 'utf8');
    assert.match(s, /function isQuiet\(\) \{\r?\n    if \(typeof isMusicOff === 'function' && isMusicOff\(\)\) return true;/, f);
  });
});
