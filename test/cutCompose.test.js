'use strict';
// CutCompose: a cut is a click that is never counted, each piece is walked on
// its own, the side made by the cut is heard in both pieces; joining turns the
// shared side into a soft inner step and a joining point on a line into a step.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const C = require('../src/lib/music/cutCompose');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const spec = (...a) => C.specForItem(item(...a));
const ev = (...a) => C.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);

test('a cut: the whole, a sharp click (never a corner), then each piece walked on its own', () => {
  const e = ev('shapeAsBar', 'גוזרים ריבוע בקו ישר מפינה לפינה. כמה משולשים מתקבלים?', 2);
  assert.equal(stage(e, 'cutClick').length, 1);
  const corners = stage(e, 'corner');
  assert.equal(corners.filter((n) => n.part === -1).length, 4);
  assert.deepEqual([0, 1].map((p) => corners.filter((n) => n.part === p).length), [3, 3]);
  assert.notEqual(stage(e, 'cutClick')[0].voice + stage(e, 'cutClick')[0].hz, corners[0].voice + corners[0].hz);
});

test('the side made by the cut is heard in both pieces, in its own timbre — sides together are six', () => {
  const e = ev('shapeAsBar', 'גוזרים מלבן מפינה לפינה לשני משולשים. כמה צלעות יש לשני החלקים יחד?', 6);
  assert.deepEqual([0, 1].map((p) => stage(e, 'sharedSide').filter((n) => n.part === p).length), [1, 1]);
  assert.equal(e.filter((n) => (n.stage === 'side' || n.stage === 'sharedSide') && n.part >= 0).length, 6);
  assert.equal(spec('piecesFillBar', 'חותכים מלבן לאורך האלכסון. האם לכל חלק יש 4 קודקודים, כמו למלבן? (כן/לא)', 'לא').value, 'לא');
  assert.equal(spec('shapeAsBar', 'גוזרים מלבן לשני מלבנים קטנים. כמה קודקודים יש לשני החלקים יחד?', 8).value, 8);
});

test('joining: the shared side becomes a soft inner step (not silence) and a joining point on a line is a step, not a corner', () => {
  const e = ev('shapeAsBar', 'מצמידים שני ריבועים זהים זה לזה ומקבלים מלבן. כמה קודקודים יש למלבן?', 4);
  assert.equal(stage(e, 'joinSound').length, 1);
  assert.equal(stage(e, 'wholeCorner').length, 4);
  assert.equal(stage(e, 'joinPoint').length, 2);
  assert.equal(stage(e, 'innerSide').length, 1);
  assert.ok(stage(e, 'innerSide')[0].gain < stage(e, 'wholeCorner')[0].gain);
  assert.equal(stage(ev('piecesFillBar', 'פירקו טרפז לריבוע ולשני משולשים. מכמה חלקים מרכיבים אותו מחדש?', 3), 'joinSound').length, 1);
});

test('two right triangles on the long side: one walked as a mirror; the whole has four corners', () => {
  const s = spec('piecesFillBar', 'מצמידים שני משולשים ישרי־זווית זהים לאורך הצלע הארוכה. איזו צורה יכולה להתקבל: מלבן או מחומש?', 'מלבן');
  assert.equal(s.mirror, true);
  assert.equal(stage(C.soundEvents(s), 'wholeCorner').length, 4);
});

test('the Star of David: two triangle voices, one by one, then together — framed with respect, never cut', () => {
  const s = spec('shapeAsBar', 'במגן דוד מסתתרים משולשים גדולים. כמה משולשים גדולים יש בו?', 2);
  const e = C.soundEvents(s);
  assert.equal(stage(e, 'triangleUp').length, 3);
  assert.equal(stage(e, 'triangleDown').length, 3);
  assert.equal(new Set(stage(e, 'together').map((n) => n.voice)).size, 2);
  assert.match(C.html(s), /לא גוזרים אותו/);
  assert.equal(stage(e, 'cutClick').length, 0);
});

test('only when the sounds give exactly the answer', () => {
  assert.equal(spec('shapeAsBar', 'גוזרים ריבוע בקו ישר מפינה לפינה. כמה משולשים מתקבלים?', 4), null, 'a wrong key is never set to sound');
  assert.equal(spec('nextBeat', 'גוזרים ריבוע בקו ישר מפינה לפינה. כמה משולשים מתקבלים?', 2), null);
  assert.equal(C.specForItem(null), null);
});

test('the bank: all cutting and composing items of grades 1–2 are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => C.specForItem(it));
  assert.equal(list.length, 12);
  const word = (h, w) => new RegExp('(^|[\\s.,:;—>(])' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '($|[\\s.,:;—<)?])').test(h);
  list.forEach((it) => {
    const s = C.specForItem(it), h = C.html(s), a = String(it.answer);
    assert.ok(/^\d+$/.test(a) ? !(h.match(/\d+/g) || []).includes(a) : !word(h, a), 'leak: ' + it.prompt);
    assert.ok(C.longestRun(C.soundEvents(s)) <= C.MAX_RUN, 'run: ' + it.prompt);
    assert.match(C.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('shapeAsBar', 'גוזרים ריבוע בקו ישר מפינה לפינה. כמה משולשים מתקבלים?', 2);
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = C.soundEvents(s).length;
  assert.deepEqual(C.play(s, env), { notes: n });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(C.play(s, {}), { notes: n, silent: true });
  assert.equal(C.play(null, env), null);
  assert.equal(C.html(null), '');
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_CUT_COMPOSE\.play\(cc\)/);
  assert.match(html, /host\._cutSpec && typeof MM_CUT_COMPOSE!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/cutCompose\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/cutCompose\.js'/);
});
