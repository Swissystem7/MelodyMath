'use strict';
// BigNumbers: an Orff ensemble, one instrument per place, all equally loud;
// from the ones upward, a turn marker before each place, a zero is real
// silence; ten of a place packed with one identical sound.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const B = require('../src/lib/music/bigNumbers');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const spec = (...a) => B.specForItem(item(...a));
const ev = (...a) => B.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);
const strokesAt = (list, place) => list.filter((n) => n.place === place && n.stage !== 'turn');

test('a number is played from the ones upward, a marker before every place; a zero is real silence', () => {
  const e = ev('thousandAccents', '6,000 + 80 + 9 = ? (כתבו בלי פסיק)', 6089);
  const turns = stage(e, 'turn');
  assert.deepEqual(turns.map((n) => n.place), [0, 1, 2, 3]);
  assert.deepEqual([0, 1, 2, 3].map((p) => strokesAt(e, p).length), [9, 8, 0, 6]);
  // the hundreds slot is silent but keeps its time
  assert.ok(turns[3].at - turns[2].at > 0.5);
  // every place has its own instrument, all at the same loudness
  assert.equal(new Set(e.filter((n) => n.stage === 'digit').map((n) => n.gain)).size, 1);
  assert.equal(new Set([0, 1, 2, 3].map((p) => B.ORFF[p][1])).size, 4);
});

test('periods of three are closed by the same frame sound', () => {
  const e = ev('periodAccentLevels', '5,000,000 + 70,000 + 300 + 8 = ? (כתבו בלי פסיק)', 5070308);
  assert.equal(stage(e, 'periodFrame').length, 2);
  assert.equal(strokesAt(e, 6).length, 5);
  assert.equal(strokesAt(e, 4).length, 7);
});

test('a digit question plays the whole number; the answer is that place\'s strokes', () => {
  const e = ev('millionAccentLevels', 'במספר 472,315, מהי ספרת מאות האלפים?', 4);
  assert.equal(strokesAt(e, 5).length, 4);
  assert.equal(spec('millionAccentLevels', 'במספר 472,315, מהי ספרת מאות האלפים?', 7), null, 'a wrong key is never set to sound');
});

test('the next number after 999,999: the first packing in full, then packing after packing to a new place', () => {
  const e = ev('millionAccentLevels', 'מה המספר שבא אחרי 999,999? (כתבו בלי פסיק)', 1000000);
  assert.equal(stage(e, 'pack').length, 6);
  assert.equal(stage(e, 'nine').length, 9);
  assert.equal(stage(e, 'newPlace').length, 1);
  const two = ev('periodAccentLevels', 'מה המספר שבא אחרי 1,999,999? (כתבו בלי פסיק)', 2000000);
  assert.equal(stage(two, 'pack').length, 6);
  assert.equal(stage(two, 'newPlace').length, 2, 'the million that was there and the one carried in');
});

test('hundreds in 2800: a bundle is first heard equal to ten hundreds, then two bundles and eight', () => {
  const e = ev('thousandAccents', 'כמה מאות שלמות יש במספר 2800?', 28);
  assert.equal(stage(e, 'demo').length, 10);
  assert.equal(stage(e, 'bundle').length, 3);
  assert.equal(stage(e, 'hundred').length, 8);
});

test('rounding: the deciding digit, its steps down against its steps up to ten', () => {
  const e = ev('millionAccentLevels', 'עגלו את 318,460 לאלפים. (כתבו בלי פסיק)', 318000);
  assert.equal(stage(e, 'down').length, 4);
  assert.equal(stage(e, 'up').length, 6);
  assert.equal(spec('periodAccentLevels', 'עגלו את 738,450 לעשרות אלפים. (כתבו בלי פסיק)', 740000).d, 8);
});

test('comparing starts at the largest place and stops where the numbers first differ', () => {
  const e = ev('thousandAccents', 'איזה גבוה יותר: 7040 הרץ או 7400 הרץ? (כתבו בלי פסיק)', 7400);
  assert.equal(stage(e, 'decided')[0].place, 2);
  assert.deepEqual(stage(e, 'turn').map((n) => n.place), [3, 2]);
  assert.equal(spec('thousandAccents', 'איזה מספר קטן יותר: 7050 או 7500? כתבו את המספר.', 7050).value, 7050);
});

test('addition column by column from the ones; ten in a column is packed and carried', () => {
  const e = ev('carryAccentUp', '3,680 + 450 = ? (כתבו בלי פסיק)', 4130);
  assert.equal(stage(e, 'pack').length, 2);
  assert.equal(stage(e, 'carried').length, 2);
});

test('subtraction and missing addends by counting up: to a round number, then the big jumps', () => {
  const s = spec('carryAccentUp', 'הצליל הגבוה ביותר בפסנתר הוא 4186 הרץ. כמה חסר לו עד 10,000? (כתבו בלי פסיק)', 5814);
  assert.ok(s, 'played');
  assert.deepEqual(s.jumps, [[0, 4], [1, 1], [2, 8], [3, 5]]);
  const t = spec('periodAccentLevels', 'בעיר אחת 1,284,000 תושבים ובעיר אחרת 1,248,000. בכמה גדול מספר התושבים בעיר הראשונה? (כתבו בלי פסיק)', 36000);
  assert.equal(t.jumps.reduce((a, [p, c]) => a + c * Math.pow(10, p), 0), 36000);
});

test('×10 and ×100 move the same pattern up the instruments; ×1 is one framed group; ×0 is framed silence', () => {
  const e = ev('millionAccentLevels', '3,450 × 100 = ? (כתבו בלי פסיק)', 345000);
  assert.equal(stage(e, 'timesTen').length, 2);
  assert.deepEqual([3, 4, 5].map((p) => strokesAt(stage(e, 'shifted'), p).length), [5, 4, 3]);
  const z = ev('regroupAllLevels', '0 × 1,234,567 = ?', 0);
  assert.equal(z.length, 2);
  assert.ok(z.every((n) => n.stage === 'periodFrame'));
});

test('thousands in a million: three levels of "opens into ten"', () => {
  const e = ev('periodAccentLevels', 'כמה אלפים יש במיליון? (כתבו בלי פסיק)', 1000);
  assert.equal(stage(e, 'opens').length, 3);
  assert.equal(stage(e, 'into').length, 30);
});

test('only for its tags, and only when the sounds give exactly the answer', () => {
  assert.equal(spec('regroupAllLevels', 'מה ערך הספרה 7 במספר 27,000,000? (כתבו בלי פסיק)', 7000000), null, 'no ten-millions instrument yet');
  assert.equal(spec('remainders', '28 × 5 = ?', 140), null);
  assert.equal(B.specForItem(null), null);
});

test('the bank: big-number items of grades 2–6 are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => B.specForItem(it));
  assert.ok(list.length >= 60, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['ב', 'ג', 'ד', 'ה', 'ו']);
  const word = (h, w) => new RegExp('(^|[\\s.,:;—>(])' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '($|[\\s.,:;—<)?])').test(h);
  list.forEach((it) => {
    const s = B.specForItem(it), h = B.html(s), a = String(it.answer);
    assert.ok(/^\d+$/.test(a) ? !(h.match(/\d+/g) || []).includes(a) : !word(h, a), 'leak: ' + it.prompt);
    assert.ok(B.longestRun(B.soundEvents(s)) <= B.MAX_RUN, 'run: ' + it.prompt);
    assert.match(B.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('thousandAccents', 'מה הספרה במקום העשרות במספר 3164?', 6);
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = B.soundEvents(s).length;
  assert.deepEqual(B.play(s, env), { notes: n });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(B.play(s, {}), { notes: n, silent: true });
  assert.equal(B.play(null, env), null);
  assert.equal(B.html(null), '');
});

test('vertical multiplication as partial products; taking away hundreds by counting up', () => {
  const e = ev('repeatedBars', 'חשבו במאונך: 586 × 7 (כתבו בלי פסיק)', 4102);
  assert.deepEqual(spec('repeatedBars', 'חשבו במאונך: 586 × 7 (כתבו בלי פסיק)', 4102).parts, [3500, 560, 42]);
  assert.equal(stage(e, 'partialSign').length, 3);
  assert.deepEqual(spec('regroupAllLevels', 'חשבו במאונך: 1,234 × 56 (כתבו בלי פסיק)', 69104).parts, [61700, 7404]);
  assert.equal(spec('repeatedBars', '4 × 5 = ?', 20), null, 'the new tags use only the new rules: TimesTable keeps its table');
  assert.deepEqual(spec('repeatedBars', '25 × 36 = ?', 900).parts, [750, 150]);
  const up = spec('takeAwayBeats', 'היו 300 כיסאות באולם. הוציאו 145 לצורך אירוע אחר. כמה כיסאות נשארו?', 155);
  assert.deepEqual(up.jumps, [[0, 5], [1, 5], [2, 1]]);
});

test('differences in tables by counting up; a sum of two shows in columns', () => {
  assert.equal(spec('rowCellGroups', 'בטבלת המבקרים בתערוכה: 2024 — 125,400 מבקרים, 2025 — 131,900 מבקרים. בכמה מבקרים יותר היו ב־2025? (כתבו בלי פסיק)', 6500).kind, 'up');
  assert.equal(spec('tableRowGroups', 'בטבלת נקודות: קבוצה א׳ — 25, קבוצה ב׳ — 18. בכמה נקודות מובילה קבוצה א׳?', 7).value, 7);
  assert.equal(spec('callResponse', 'בהצגה הראשונה נכחו 180 צופים, ובשנייה 215. כמה צופים נכחו בסך הכול בשתי ההצגות?', 395).kind, 'add');
});

test('the modules that already own an item keep it', () => {
  const owners = ['multiplyWorlds', 'timesTable', 'takeAwayTen', 'dragPlace', 'dataWorlds', 'earlyBeats'].map((f) => require('../src/lib/music/' + f));
  banks.allItems().filter((it) => B.specForItem(it)).forEach((it) => owners.forEach((o) => assert.equal(o.specForItem(it), null, 'both play: ' + it.prompt)));
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_BIG_NUMBERS\.play\(bn\)/);
  assert.match(html, /host\._bigSpec && typeof MM_BIG_NUMBERS!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/bigNumbers\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/bigNumbers\.js'/);
});
