'use strict';
// MeasureWorlds: units, box parts, surface area and volume, heard. Length,
// area and volume each have their own sound and their own shape in time.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const M = require('../src/lib/music/measureWorlds');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const spec = (...a) => M.specForItem(item(...a));
const ev = (...a) => M.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);

test('converting: the first big unit splits in full into ten strokes; each next big stroke stands for its ten', () => {
  const e = ev('metreHundredGroups', 'כמה ס״מ יש ב־2 מטרים?', 200);
  assert.equal(stage(e, 'big').length, 2);
  const parts = stage(e, 'part');
  assert.equal(parts.length, 10);
  assert.ok(parts.every((n) => n.worth === 10), 'each stroke of the split is ten centimetres');
  assert.ok(parts[0].at > stage(e, 'big')[0].at && parts[9].at < stage(e, 'big')[1].at, 'the split comes right after the first big stroke');
  assert.match(M.html(spec('metreHundredGroups', 'כמה ס״מ יש ב־2 מטרים?', 200)), /כל מכה בפירוק שווה עשרה ס״מ/);
});

test('a duration is never a number: every big stroke has the same length, whatever the unit', () => {
  const durs = ['כמה ס״מ יש ב־2 מטרים?', 'כמה גרם יש ב־3 ק״ג?', 'כמה מ״מ יש ב־3 ס״מ?'].map((p, i) => stage(ev('metreHundredGroups', p, [200, 3000, 30][i]), 'big')[0].dur);
  assert.equal(new Set(durs).size, 1);
});

test('half a litre: the litre splits, and the second half of it is silence', () => {
  const e = ev('metreHundredGroups', 'כמה מ״ל יש בחצי ליטר?', 500);
  assert.equal(stage(e, 'part').length, 5);
  assert.equal(stage(e, 'part').reduce((s, n) => s + n.worth, 0), 500);
});

test('a rope cut into pieces: a sound is a piece, a silence is a cut', () => {
  const e = ev('metreHundredGroups', 'חבל באורך 3 מטרים נחתך לחתיכות של 50 ס״מ. כמה חתיכות יש?', 6);
  assert.equal(stage(e, 'piece').length, 6);
  assert.match(M.html(spec('metreHundredGroups', 'חבל באורך 3 מטרים נחתך לחתיכות של 50 ס״מ. כמה חתיכות יש?', 6)), /לא חתכים/);
  assert.equal(stage(ev('litreThousandGroups', 'כמה כוסות של 250 מ״ל אפשר למזוג מבקבוק של ליטר וחצי?', 6), 'pour').length, 6);
});

test('the cajón is a box: a face is deep, an edge sharp, a corner short and high — counted in groups', () => {
  const faces = ev('faceEdgeGroups', 'כמה פאות יש לתיבה?', 6), edges = ev('faceEdgeGroups', 'כמה מקצועות יש לתיבה?', 12), corners = ev('faceEdgeGroups', 'כמה קודקודים יש לקובייה?', 8);
  assert.equal(faces.length, 6);
  assert.equal(edges.length, 12);
  assert.equal(corners.length, 8);
  assert.ok(faces[0].hz < edges[0].hz && edges[0].hz < corners[0].hz);
  assert.deepEqual([0, 1, 2].map((g) => edges.filter((n) => n.group === g).length), [4, 4, 4]);
});

test('area is covering in rows — a row alone would be a length; the short silence marks a new row', () => {
  const e = ev('faceAreaGroups', 'פאה של תיבה היא מלבן של 3 ס״מ על 2 ס״מ. מה שטח הפאה בסמ״ר?', 6);
  const c = stage(e, 'cover');
  assert.equal(c.length, 6);
  assert.deepEqual([0, 1].map((r) => c.filter((n) => n.row === r).length), [3, 3]);
  assert.ok(c[3].at - c[2].at > c[1].at - c[0].at + 0.15, 'a silence between rows');
});

test('area and volume sound different: covering is bright, filling is deep', () => {
  const cover = stage(ev('faceAreaGroups', 'פאה של תיבה היא מלבן של 3 ס״מ על 2 ס״מ. מה שטח הפאה בסמ״ר?', 6), 'cover')[0];
  const fill = stage(ev('cubeLayerGroups', 'מידות תיבה 2 ס״מ, 3 ס״מ ו־4 ס״מ. מה נפחה בסמ״ק?', 24), 'fill')[0];
  assert.notEqual(cover.voice + cover.hz, fill.voice + fill.hz);
  assert.ok(fill.hz < cover.hz);
});

test('surface area of a box: each kind of face covered once, its twin a single deep stroke', () => {
  const e = ev('faceAreaGroups', 'לתיבה מידות של 3, 2 ו־1 ס״מ. מה שטח הפנים שלה בסמ״ר?', 22);
  assert.deepEqual([0, 1, 2].map((p) => stage(e, 'cover').filter((n) => n.pair === p).length), [6, 3, 2]);
  assert.equal(stage(e, 'twin').length, 3);
});

test('doubling a cube\'s edge: the row gets longer AND there are more rows — four times the area', () => {
  const e = ev('faceAreaGroups', 'המקצוע של קובייה גדל מ־1 ס״מ ל־2 ס״מ. פי כמה גדל שטח הפנים?', 4);
  assert.equal(stage(e, 'cover').filter((n) => n.size === 0).length, 1);
  assert.equal(stage(e, 'cover').filter((n) => n.size === 1).length, 4);
});

test('volume is filling in layers: rows with short silences, layers with long ones', () => {
  const e = ev('cubeLayerGroups', 'מידות תיבה 2 ס״מ, 3 ס״מ ו־4 ס״מ. מה נפחה בסמ״ק?', 24);
  const f = stage(e, 'fill');
  assert.equal(f.length, 24);
  assert.deepEqual([0, 1, 2, 3].map((l) => f.filter((n) => n.layer === l).length), [6, 6, 6, 6]);
  const h = ev('cubeLayerGroups', 'נפח תיבה 200 סמ״ק, אורכה 10 ס״מ ורוחבה 5 ס״מ. מה גובהה בס״מ?', 4);
  assert.equal(stage(h, 'fill').length, 10);
  assert.equal(stage(h, 'rowStroke').length, 5);
  assert.equal(stage(h, 'layer').length, 4);
});

test('only when the sounds give exactly the answer', () => {
  assert.equal(spec('metreHundredGroups', 'כמה ס״מ יש ב־2 מטרים?', 20), null, 'a wrong key is never set to sound');
  assert.equal(spec('cubeLayerGroups', 'מידות תיבה 1.5 מ׳, 2 מ׳ ו־0.5 מ׳. מה נפחה במ״ק?', 1.5), null);
  assert.equal(spec('nextBeat', 'כמה ס״מ יש ב־2 מטרים?', 200), null);
  assert.equal(M.specForItem(Object.assign(item('metreHundredGroups', 'כמה ס״מ יש ב־2 מטרים?', 200), { noMusic: true })), null);
  assert.equal(M.specForItem(null), null);
});

test('cubes taken out are silent in their places; two boxes compared layer by layer, then counting on', () => {
  const t = M.soundEvents(M.specForItem({ music: 'cubeLayerGroups', prompt: 'בתיבה 10 קוביות. הוצאנו 3. כמה קוביות נשארו?', answer: 7 }));
  assert.equal(t.filter((n) => n.stage === 'fill').length, 10);
  assert.equal(t.filter((n) => n.stage === 'left').length, 7);
  const c = M.soundEvents(M.specForItem({ music: 'cubeLayerGroups', prompt: 'תיבה אחת בנויה מ־2 שכבות של 6 קוביות, ותיבה שנייה מ־3 שכבות של 3 קוביות. בכמה קוביות יש בראשונה יותר?', answer: 3 }));
  assert.equal(c.filter((n) => n.stage === 'layer').length, 5);
  assert.equal(c.filter((n) => n.stage === 'more').length, 3);
});

test('the bank: measurement items of grades 2, 4 and 6 are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => M.specForItem(it));
  assert.ok(list.length >= 22, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['ב', 'ד', 'ו']);
  list.forEach((it) => {
    const s = M.specForItem(it), h = M.html(s), a = String(it.answer);
    assert.ok(/^\d+$/.test(a) ? !(h.match(/\d+/g) || []).includes(a) : !h.includes(a), 'leak: ' + it.prompt);
    assert.ok(M.longestRun(M.soundEvents(s)) <= M.MAX_RUN, 'run: ' + it.prompt);
    assert.match(M.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('metreHundredGroups', 'כמה ס״מ יש ב־2 מטרים?', 200);
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = M.soundEvents(s).length;
  assert.deepEqual(M.play(s, env), { notes: n });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(M.play(s, {}), { notes: n, silent: true });
  assert.equal(M.play(null, env), null);
  assert.equal(M.html(null), '');
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_MEASURE_WORLDS\.play\(mz\)/);
  assert.match(html, /host\._measureSpec && typeof MM_MEASURE_WORLDS!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/measureWorlds\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/measureWorlds\.js'/);
});
