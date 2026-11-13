'use strict';
// ShapeWalk: shapes and angles, heard. Walking the shape (a stamp per corner,
// a silence per side) and a turning hand compared with a page corner are two
// separate modes; no shape has a sound of its own.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const S = require('../src/lib/music/shapeWalk');
const banks = require('../src/lib/banks');

const item = (music, grade, prompt, answer) => ({ music: music, grade: grade, prompt: prompt, answer: answer });
const spec = (...a) => S.specForItem(item(...a));
const ev = (...a) => S.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);
const gapsAfterCorners = (list) => { const c = stage(list, 'corner'); const close = list.find((n) => n.stage === 'close'); return c.map((n, i) => +((i + 1 < c.length ? c[i + 1].at : close.at) - n.at).toFixed(3)); };

test('walking a shape: a stamp per corner, a silence per side, a soft breath closes the circle', () => {
  const e = ev('shapeLoop', 'א', 'למחומש יש כמה צלעות?', 5);
  assert.equal(stage(e, 'corner').length, 5);
  assert.equal(stage(e, 'close').length, 1);
  assert.equal(new Set(gapsAfterCorners(e)).size, 1, 'a regular shape: equal sides are equal silences');
  const rect = gapsAfterCorners(ev('shapeLoop', 'א', 'למלבן יש כמה קודקודים?', 4));
  assert.equal(rect[0], rect[2]);
  assert.equal(rect[1], rect[3]);
  assert.notEqual(rect[0], rect[1], 'a rectangle: two pairs of equal sides');
});

test('no shape has a sound of its own: every corner is the same stamp', () => {
  const names = { 3: 'משולש', 4: 'ריבוע', 5: 'מחומש', 6: 'משושה' };
  const corners = [3, 4, 5, 6].map((n) => stage(ev('shapeLoop', 'א', 'צורה עם ' + n + ' צלעות שוות — איך קוראים לה?', names[n]), 'corner'));
  assert.deepEqual(corners.map((c) => c.length), [3, 4, 5, 6]);
  assert.equal(new Set(corners.flat().map((n) => n.voice + n.hz)).size, 1);
});

test('comparing shapes: each shape in the order of the question, with a pause between', () => {
  const s = spec('shapeLoop', 'א', 'איזו צורה יש לה הכי מעט צלעות: משולש, ריבוע או מחומש?', 'משולש');
  const e = S.soundEvents(s);
  assert.equal(stage(e, 'close').length, 3);
  assert.deepEqual(s.shapes, ['משולש', 'ריבוע', 'מחומש']);
  assert.equal(spec('sideCountMotif', 'ב', 'משולש, ריבוע ומחומש — מיינו לפי מספר הצלעות מהקטן לגדול. מה השני ברשימה?', 'ריבוע').value, 'ריבוע');
});

test('an angle on its own: a page corner is always played first as the model, then the angle in the same ticks', () => {
  const e = ev('turnAsBar', 'ג', 'זווית של 150 מעלות — חדה, ישרה, קהה או שטוחה?', 'קהה');
  assert.equal(stage(e, 'model').length, 3);
  assert.equal(stage(e, 'tick').length, 5, 'more ticks than the model: wider than a page corner');
  const no45 = spec('quarterTurnBar', 'א', 'האם זווית של 45 מעלות היא זווית ישרה? (כן/לא)', 'לא');
  assert.equal(no45.unit, 15);
  assert.equal(stage(S.soundEvents(no45), 'tick').length, 3);
  assert.equal(stage(S.soundEvents(no45), 'model').length, 6);
});

test('two right angles side by side are two turns with a short silence — together twice the model', () => {
  const e = ev('turnAsBar', 'ג', 'שתי זוויות ישרות זו ליד זו יוצרות יחד זווית — חדה, ישרה, קהה או שטוחה?', 'שטוחה');
  const ticks = stage(e, 'tick');
  assert.equal(ticks.filter((n) => n.part === 0).length, 3);
  assert.equal(ticks.filter((n) => n.part === 1).length, 3);
  assert.equal(ticks.length, 2 * stage(e, 'model').length);
});

test('clock hands: 3:00 is the model exactly, 6:00 twice the model', () => {
  assert.equal(stage(ev('turnAsBar', 'ג', 'בשעה 3:00 מחוגי השעון יוצרים זווית — חדה, ישרה, קהה או שטוחה?', 'ישרה'), 'tick').length, 3);
  assert.equal(stage(ev('turnAsBar', 'ג', 'בשעה 6:00 מחוגי השעון יוצרים זווית — חדה, ישרה, קהה או שטוחה?', 'שטוחה'), 'tick').length, 6);
  assert.equal(spec('turnAsBar', 'ג', 'בשעה 3:00 מחוגי השעון יוצרים זווית — חדה, ישרה, קהה או שטוחה?', 'ישרה').world, S.WORLDS.clock);
});

test('a triangle\'s corners are compared with the model one by one (100, 40, 40 in ticks of ten)', () => {
  const s = spec('triangleMotif', 'ג', 'זוויות המשולש הן 100, 40 ו־40 מעלות — חד־זווית, ישר־זווית או קהה־זווית?', 'קהה־זווית');
  assert.equal(s.unit, 10);
  const e = S.soundEvents(s);
  assert.equal(stage(e, 'model').length, 9);
  assert.deepEqual([0, 1, 2].map((n) => stage(e, 'cornerTick').filter((x) => x.n === n).length), [10, 4, 4]);
});

test('equal sides are equal silences: exactly two equal sides', () => {
  const g = gapsAfterCorners(ev('triangleMotif', 'ג', 'למשולש יש בדיוק שתי צלעות שוות — שווה־צלעות, שווה־שוקיים או שונה־צלעות?', 'שווה־שוקיים'));
  assert.equal(g[0], g[1]);
  assert.notEqual(g[1], g[2]);
});

test('parallel sides share one walking motif: a square has two pairs, a trapezoid one', () => {
  const motifs = (e) => stage(e, 'side').filter((n, i) => i % 2 === 0).map((n) => n.motif);
  assert.deepEqual(motifs(ev('parallelVoices', 'ד', 'כמה זוגות של צלעות מקבילות יש לריבוע?', 2)), [0, 1, 0, 1]);
  assert.deepEqual(motifs(ev('parallelVoices', 'ד', 'כמה זוגות של צלעות מקבילות יש לטרפז?', 1)), [0, 1, 0, 2]);
});

test('parallel rows step together and never meet; perpendicular rows meet at a page corner', () => {
  const par = ev('parallelVoices', 'ד', 'שני ישרים שלעולם אינם נפגשים — מקבילים או מאונכים?', 'מקבילים');
  assert.equal(stage(par, 'meet').length, 0);
  assert.deepEqual(stage(par, 'rowA').map((n) => n.at), stage(par, 'rowB').map((n) => n.at));
  const perp = ev('parallelVoices', 'ד', 'במלבן, שתי צלעות שנפגשות בפינה — מקבילות או מאונכות?', 'מאונכות');
  assert.equal(stage(perp, 'meet').length, 1);
  assert.equal(stage(perp, 'cornerTick').length, stage(perp, 'model').length);
});

test('a rhombus: equal silences, corners narrower and wider than the model in turn', () => {
  const e = ev('quadMotif', 'ד', 'מרובע שכל ארבע צלעותיו שוות אבל זוויותיו אינן ישרות — איך קוראים לו?', 'מעוין');
  assert.deepEqual([0, 1, 2, 3].map((n) => stage(e, 'cornerTick').filter((x) => x.n === n).length), [2, 4, 2, 4]);
  assert.equal(stage(ev('quadMotif', 'ד', 'כמה אלכסונים יש למרובע?', 2), 'diagonal').length, 2, 'a diagonal is a long crossing voice, never a stamp');
});

test('the circle of fifths: a whole turn of twelve steps first, then the steps of the question', () => {
  const e = ev('sectorAsNote', 'ו', 'מדו לפה דיאז — 6 צעדים, חצי סיבוב. כמה מעלות?', 180);
  assert.equal(stage(e, 'circle').length, 12);
  assert.equal(stage(e, 'step').length, 6);
  const hz = stage(e, 'circle').map((n) => n.hz);
  assert.ok(Math.max(...hz) / Math.min(...hz) < 2, 'folded into one octave — the steps do not run away upwards');
  assert.equal(spec('sectorAsNote', 'ו', 'לגזרה זווית של 90° במרכז. איזה חלק היא מכל העיגול? (כשבר)', '1/4').steps, 3);
});

test('only when the sounds give exactly the answer; degrees are not counted in grades 1–2', () => {
  assert.equal(spec('turnAsBar', 'ג', 'זווית של 150 מעלות — חדה, ישרה, קהה או שטוחה?', 'חדה'), null, 'a wrong key is never set to sound');
  assert.equal(spec('quarterTurnBar', 'א', 'זווית ישרה שווה לכמה מעלות?', 90), null);
  assert.equal(spec('nextBeat', 'א', 'למחומש יש כמה צלעות?', 5), null);
  assert.equal(S.specForItem(Object.assign(item('shapeLoop', 'א', 'למחומש יש כמה צלעות?', 5), { noMusic: true })), null);
  assert.equal(S.specForItem(null), null);
});

test('the bank: shapes and angles of grades 1–6 are heard; no answer — number or word — in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => S.specForItem(it));
  assert.ok(list.length >= 45, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['א', 'ב', 'ג', 'ד', 'ו']);
  const word = (h, w) => new RegExp('(^|[\\s.,:;—>(])' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '($|[\\s.,:;—<)?])').test(h);
  list.forEach((it) => {
    const s = S.specForItem(it), h = S.html(s), a = String(it.answer);
    assert.ok(/^\d+$/.test(a) ? !(h.match(/\d+/g) || []).includes(a) : !word(h, a), 'leak: ' + it.prompt);
    assert.ok(S.longestRun(S.soundEvents(s)) <= S.MAX_RUN, 'run: ' + it.prompt);
    assert.match(S.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('shapeLoop', 'א', 'למחומש יש כמה צלעות?', 5);
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 2, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = S.soundEvents(s).length;
  assert.deepEqual(S.play(s, env), { notes: n });
  assert.ok(calls.every((c) => c.when >= 2.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(S.play(s, {}), { notes: n, silent: true });
  assert.equal(S.play(null, env), null);
  assert.equal(S.html(null), '');
});

test('at most one right corner in a triangle: after two, nothing is left for the third and it never closes', () => {
  const s = S.specForItem({ music: 'triangleMotif', grade: 'ג', standard: 'מיון משולשים לפי זוויות ולפי צלעות', prompt: 'כמה זוויות ישרות יכולות להיות לכל היותר במשולש אחד?', answer: 1 });
  assert.deepEqual(s.corners, [90, 90, 0]);
  assert.match(S.html(s), /לא נסגר/);
});
test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_SHAPE_WALK\.play\(sw\)/);
  assert.match(html, /host\._shapeSpec && typeof MM_SHAPE_WALK!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/shapeWalk\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/shapeWalk\.js'/);
});
