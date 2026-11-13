'use strict';
// AreaWorlds: perimeter is walking, area is covering, a triangle is one of two
// equal voices, a parallelogram's cut piece is heard moving, solids by parts.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const A = require('../src/lib/music/areaWorlds');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const spec = (...a) => A.specForItem(item(...a));
const ev = (...a) => A.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);

test('perimeter: a step is a centimetre, a stamp is a corner and is not a length, a closing sound back home', () => {
  const e = ev('sideNotes', 'למשולש צלעות של 3, 4 ו־5 ס״מ. מה ההיקף בס״מ?', 12);
  assert.equal(stage(e, 'step').length, 12);
  assert.equal(stage(e, 'corner').length, 3);
  assert.deepEqual([0, 1, 2].map((s) => stage(e, 'step').filter((n) => n.side === s).length), [3, 4, 5]);
  assert.equal(e[e.length - 1].stage, 'home');
});

test('from the perimeter back to a side: four equal phrases', () => {
  const e = ev('sideNotes', 'היקף ריבוע הוא 20 ס״מ. כמה ס״מ אורך כל צלע?', 5);
  assert.deepEqual([0, 1, 2, 3].map((s) => stage(e, 'step').filter((n) => n.side === s).length), [5, 5, 5, 5]);
  assert.equal(spec('sideNotes', 'היקף מלבן הוא 10 ס״מ, ואחת מצלעותיו 3 ס״מ. כמה ס״מ הצלע הסמוכה לה?', 2).value, 2);
});

test('perimeter and area sound different: feet walk, hands cover', () => {
  const walkStep = stage(ev('sideNotes', 'לריבוע צלע של 3 ס״מ. מה ההיקף בס״מ?', 12), 'step')[0];
  const tap = stage(ev('areaScore', 'ריבוע שצלעו 4 ס״מ. מה שטחו בסמ״ר?', 16), 'tap')[0];
  assert.notEqual(walkStep.voice + walkStep.hz, tap.voice + tap.hz);
});

test('area: a bright tap per unit square, a deep stroke ends each row and is not counted', () => {
  const e = ev('areaScore', 'מלבן שאורכו 7 ס״מ ורוחבו 3 ס״מ. מה שטחו בסמ״ר?', 21);
  assert.equal(stage(e, 'tap').length, 21);
  assert.equal(stage(e, 'rowEnd').length, 3);
  assert.equal(spec('areaScore', 'שטח מלבן הוא 24 סמ״ר ואורכו 6 ס״מ. כמה ס״מ רוחבו?', 4).value, 4);
});

test('a triangle is one of two equal voices that make the rectangle — never a rectangle with holes', () => {
  const e = ev('areaScore', 'במשולש, הבסיס 6 ס״מ והגובה אליו 4 ס״מ. מה שטח המשולש בסמ״ר?', 12);
  assert.equal(stage(e, 'voiceA').length, 12);
  assert.equal(stage(e, 'voiceB').length, 12);
  assert.notEqual(stage(e, 'voiceA')[0].hz, stage(e, 'voiceB')[0].hz);
  assert.equal(stage(e, 'cut').length, 1);
  assert.equal(stage(ev('areaScore', 'למקבילית ולמשולש אותו בסיס ואותו גובה. פי כמה גדול שטח המקבילית משטח המשולש?', 2), 'voiceB').length, 6);
});

test('a parallelogram: the slanted side is a glide (not counted), the cut piece is heard moving, then rows of base by height', () => {
  const e = ev('areaScore', 'במקבילית, אורך צלע 8 ס״מ והגובה אליה 5 ס״מ. מה שטח המקבילית בסמ״ר?', 40);
  assert.equal(stage(e, 'slant').length, 1);
  assert.equal(stage(e, 'cutLeft').length, 3);
  assert.equal(stage(e, 'cutRight').length, 3);
  assert.ok(stage(e, 'cutRight')[0].at > stage(e, 'cutLeft')[2].at);
  assert.equal(stage(e, 'dum').length, 40);
  assert.equal(stage(e, 'tak').length, 5, 'a tak is a step up the height');
});

test('composite: an L is two players; a big yard is counted in blocks of five by five, the removed corner is simply not played', () => {
  const L = ev('splitRowGroups', 'מצולע בצורת L מורכב ממלבן של 6 ס״מ על 4 ס״מ וממלבן של 3 ס״מ על 2 ס״מ. מה שטחו בסמ״ר?', 30);
  assert.equal(stage(L, 'tap').filter((n) => n.rect === 0).length, 24);
  assert.equal(stage(L, 'tap').filter((n) => n.rect === 1).length, 6);
  const yard = ev('splitRowGroups', 'מחצר מלבנית של 20 מ׳ על 15 מ׳ מורידים פינה ריבועית של 5 מ׳ על 5 מ׳. מה שטח מה שנשאר במ״ר?', 275);
  assert.equal(stage(yard, 'block').length, 12);
  assert.equal(stage(yard, 'left').length, 11);
  assert.equal(stage(ev('splitRowGroups', 'מגדילים פי 2 כל צלע של מלבן של 8 ס״מ על 6 ס״מ. פי כמה גדל השטח?', 4), 'big').length, 4);
  assert.equal(stage(ev('splitRowGroups', 'ממלבן של 8 ס״מ על 6 ס״מ מורידים ריבוע של 2 ס״מ בפינה. מה היקף הצורה שנשארה בס״מ?', 28), 'step').length, 28, 'cutting a corner keeps the perimeter');
});

test('prisms and pyramids: a face is a held tone, an edge a click, a corner a deep stroke', () => {
  const faces = ev('solidFaceMotif', 'כמה פאות יש למנסרה משולשת?', 5);
  assert.equal(stage(faces, 'base').length, 2);
  assert.equal(stage(faces, 'side').length, 3);
  const pyr = ev('solidFaceMotif', 'כמה קודקודים יש לפירמידה שבסיסה ריבוע?', 5);
  assert.deepEqual([0, 1].map((l) => stage(pyr, 'vertex').filter((n) => n.level === l).length), [4, 1], 'a pyramid closes into one corner');
  assert.deepEqual([0, 1, 2].map((g) => stage(ev('solidFaceMotif', 'כמה מקצועות יש למנסרה משולשת?', 9), 'edge').filter((n) => n.group === g).length), [3, 3, 3]);
  assert.equal(stage(ev('solidFaceMotif', 'בפריסה של פירמידה שבסיסה משושה, כמה משולשים יש?', 6), 'sideFace').length, 6);
});

test('heights: a dum for each side and a tak for the height to it; parallel sides share one tak', () => {
  const tri = ev('areaScore', 'כמה גבהים יש לכל משולש?', 3);
  assert.equal(new Set(stage(tri, 'height').map((n) => n.hz)).size, 3);
  const par = ev('areaScore', 'כמה גבהים שונים, לפי הצלעות, יש למקבילית?', 2);
  assert.equal(stage(par, 'side').length, 4);
  assert.equal(new Set(stage(par, 'height').map((n) => n.hz)).size, 2);
  assert.equal(stage(ev('areaScore', 'במשולש קהה־זווית, האם גובה יכול ליפול מחוץ למשולש? (כן/לא)', 'כן'), 'beyond').length, 2);
});

test('a height from an area: the rectangle in rows of the base; the other height of a parallelogram; two of a kind', () => {
  const h = ev('areaScore', 'שטח משולש 20 סמ״ר והבסיס 8 ס״מ. מה הגובה לבסיס זה בס״מ?', 5);
  assert.equal(stage(h, 'row').length, 5);
  assert.equal(stage(h, 'dum').length, 40, 'the rectangle is twice the triangle');
  const o = ev('areaScore', 'במקבילית צלעות של 10 ס״מ ו־6 ס״מ. הגובה לצלע של 10 ס״מ הוא 3 ס״מ. מה הגובה לצלע של 6 ס״מ, בס״מ?', 5);
  assert.equal(stage(o, 'row').length, 3);
  assert.equal(stage(o, 'row2').length, 5);
  const two = ev('partsRowGroups', 'מצולע מורכב משתי מקביליות זהות, בסיס כל אחת 6 ס״מ וגובהה 4 ס״מ. מה שטחו בסמ״ר?', 48);
  assert.equal(stage(two, 'dum').length, 24);
  assert.equal(stage(two, 'copy').length, 1);
});

test('only when the sounds give exactly the answer', () => {
  assert.equal(spec('sideNotes', 'לריבוע צלע של 3 ס״מ. מה ההיקף בס״מ?', 9), null, 'a wrong key is never set to sound');
  assert.equal(spec('areaScore', 'קיר בצורת מקבילית: אורך הצלע 86 מטרים והגובה אליה 55 מטרים. מה השטח במ״ר? (כתבו בלי פסיק)', 4730), null);
  assert.equal(spec('nextBeat', 'לריבוע צלע של 3 ס״מ. מה ההיקף בס״מ?', 12), null);
  assert.equal(A.specForItem(null), null);
});

test('the bank: perimeter, area and solids of grades 2–6 are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => A.specForItem(it));
  assert.ok(list.length >= 40, 'played ' + list.length);
  const word = (h, w) => new RegExp('(^|[\\s.,:;—>(])' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '($|[\\s.,:;—<)?])').test(h);
  list.forEach((it) => {
    const s = A.specForItem(it), h = A.html(s), a = String(it.answer);
    assert.ok(/^\d+$/.test(a) ? !(h.match(/\d+/g) || []).includes(a) : !word(h, a), 'leak: ' + it.prompt);
    assert.ok(A.longestRun(A.soundEvents(s)) <= A.MAX_RUN, 'run: ' + it.prompt);
    assert.match(A.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('sideNotes', 'לריבוע צלע של 3 ס״מ. מה ההיקף בס״מ?', 12);
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = A.soundEvents(s).length;
  assert.deepEqual(A.play(s, env), { notes: n });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(A.play(s, {}), { notes: n, silent: true });
  assert.equal(A.play(null, env), null);
  assert.equal(A.html(null), '');
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_AREA_WORLDS\.play\(aw\)/);
  assert.match(html, /host\._areaSpec && typeof MM_AREA_WORLDS!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/areaWorlds\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/areaWorlds\.js'/);
});
