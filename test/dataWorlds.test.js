'use strict';
// DataWorlds: tables, tallies, the mode, the mean, displays, even/odd and
// primes, heard. A timbre is a category, the number of strokes is how many;
// the mode is a value; the mean is built, not observed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const D = require('../src/lib/music/dataWorlds');
const TT = require('../src/lib/music/takeAwayTen');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const spec = (...a) => D.specForItem(item(...a));
const ev = (...a) => D.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);
const COLORS = 'בטבלת השכיחויות של צבעי החולצות: אדום — 100, ירוק — 50, כחול — 25, לבן — 25. ';

test('a table: a timbre per category, one after the other, with a silence between; equal loudness', () => {
  const e = ev('tableRowGroups', 'בטבלת החוגים רשומים: כדורגל — 12 תלמידים, מוזיקה — 8 תלמידים, ציור — 5 תלמידים. כמה תלמידים בחוג המוזיקה?', 8);
  assert.deepEqual([0, 1, 2].map((k) => stage(e, 'cat').filter((n) => n.cat === k).length), [12, 8, 5]);
  assert.equal(new Set(e.map((n) => n.gain)).size, 1, 'a loud drum must not sound like "many"');
  assert.equal(new Set(e.map((n) => n.voice)).size, 3);
});

test('big counts use a scale said in words: one stroke is twenty-five', () => {
  const s = spec('tallyFives', COLORS + 'מה השכיחות של ירוק?', 50);
  assert.equal(s.unit, 25);
  assert.deepEqual([0, 1, 2, 3].map((k) => stage(D.soundEvents(s), 'cat').filter((n) => n.cat === k).length), [4, 2, 1, 1]);
  assert.match(D.html(s), /כל הקשה שווה עשרים וחמישה/);
});

test('the mode of categories is the category (not its count); a part of the whole is a fraction', () => {
  assert.equal(spec('tallyFives', COLORS + 'איזה צבע הוא השכיח?', 'אדום').value, 'אדום');
  assert.equal(spec('tallyFives', COLORS + 'איזה חלק מהתלמידים לבשו חולצה אדומה? כתבו שבר.', '1/2').value, '1/2');
});

test('the mode of values: pitch is the value, in order, so the longest run of one pitch is the mode', () => {
  const e = ev('tallyFives', 'הציונים בבוחן: 7, 8, 8, 9, 8, 10, 7. מהו השכיח?', 8);
  const v = stage(e, 'value');
  assert.deepEqual(v.map((n) => n.v), [7, 7, 8, 8, 8, 9, 10]);
  const hz = v.map((n) => n.hz);
  assert.ok(hz.every((x, i) => i === 0 || x >= hz[i - 1]), 'from low to high');
  assert.equal(spec('tallyFives', 'מספר האחים של תלמידי קבוצה: 1, 2, 2, 3, 1, 2, 4, 2, 0. מה השכיחות של המספר 2?', 4).value, 4);
});

test('a list becomes a table: the list as it came, then sorted by timbre — the same number of strokes', () => {
  const e = ev('listToGroups', 'רשמנו את הכלי שכל ילד בחר: תוף, חליל, תוף, משולש, תוף, חליל, תוף. בטבלה מסודרת — כמה בחרו תוף?', 4);
  assert.equal(stage(e, 'raw').length, stage(e, 'sorted').length);
  assert.equal(stage(e, 'sorted').filter((n) => n.cat === 0).length, 4);
});

test('a tally: five equal strokes, a short silence, the rest — the silence is the border, no accent', () => {
  const t = stage(ev('listToGroups', 'ספירת שירים בסימני ספירה: פופ — ||||| ||, רוק — |||. כמה שירי פופ נספרו?', 7), 'tally').filter((n) => n.cat === 0);
  assert.equal(t.length, 7);
  assert.equal(new Set(t.map((n) => n.gain)).size, 1);
  assert.ok(t[5].at - t[4].at > t[1].at - t[0].at + 0.3);
});

test('the mean is built: floor strokes, what each has above the floor, then a fair share in rounds', () => {
  const s = spec('levelNotes', 'שקלו 4 קלמנטינות: 60, 70, 80 ו־90 גרם. מה המשקל הממוצע בגרם?', 75);
  assert.equal(s.floor, 60);
  assert.equal(s.unit, 5);
  const e = D.soundEvents(s);
  assert.deepEqual([0, 1, 2, 3].map((d) => stage(e, 'above').filter((n) => n.d === d).length), [0, 2, 4, 6]);
  assert.equal(stage(e, 'share').length, 12, 'three rounds, one to each of four');
  assert.ok(!s.units.includes(s.share), 'nobody had the mean at the start');
  assert.equal(spec('levelNotes', 'הקשתם 4 פעמים: 78, 82, 80 ו־84 BPM. מה הקצב הממוצע?', 81).share, 3);
});

test('mean × count is the sum: five equal groups', () => {
  const e = ev('levelNotes', 'הממוצע של 5 מספרים הוא 20. מה סכום המספרים?', 100);
  assert.equal(new Set(stage(e, 'level').map((n) => n.d)).size, 5);
});

test('displays: a pie is the hora circle; a pictogram symbol first opens into its units', () => {
  const pie = ev('showAsBar', 'מציגים 30 בעד ו־10 נגד בדיאגרמת עוגה של 4 חלקים שווים. כמה חלקים יהיו «בעד»?', 3);
  assert.equal(stage(pie, 'yes').length, 3);
  assert.equal(stage(pie, 'no').length, 1);
  const pic = ev('showAsBar', 'בפיקטוגרם כל סמל הוא 5 תלמידים. כמה סמלים יציגו 35 תלמידים?', 7);
  assert.equal(stage(pic, 'unit').length, 5);
  assert.equal(stage(pic, 'symbol').length, 7);
  assert.equal(stage(ev('showAsBar', 'בסקר 25% בחרו בכחול. כמה מעלות תהיה הגזרה של כחול בדיאגרמת עוגה?', 90), 'tick').length, 3);
});

test('even and odd: steps in pairs, a step with no partner alone after a silence', () => {
  const odd = ev('alternateDrums', '9 זוגי או אי־זוגי?', 'אי-זוגי');
  assert.equal(stage(odd, 'pair').length, 8);
  assert.equal(stage(odd, 'alone').length, 1);
  assert.equal(stage(ev('alternateDrums', '6 זוגי או אי־זוגי?', 'זוגי'), 'alone').length, 0);
});

test('a prime cannot be split into equal bars — 51 can: three bars of seventeen', () => {
  const e = ev('stickingParity', 'האם 51 הוא מספר ראשוני? (כן/לא)', 'לא');
  assert.deepEqual([0, 1, 2].map((b) => e.filter((n) => n.bar === b).reduce((s, n) => s + (n.stage === 'barTen' ? 10 : 1), 0)), [17, 17, 17]);
  assert.equal(stage(ev('stickingParity', 'האם 2,345 מתחלק ב־5? (כן/לא)', 'כן'), 'one').length, 5);
});

test('a mean that does not share out evenly: whole rounds, then each unit left breaks into one piece per dancer', () => {
  const e = ev('levelNotes', 'הקשתם 4 פעמים: 80, 81, 82 ו־84 BPM. מה הקצב הממוצע?', 81.75);
  assert.equal(stage(e, 'share').length, 4, 'one whole round');
  assert.equal(stage(e, 'piece').length, 12, 'three units left, each in four pieces: three quarters for every dancer');
  assert.equal(spec('levelNotes', 'הממוצע של 4, 6 ו־8 הוא 6. מוסיפים לקבוצה את 0. מה הממוצע החדש?', 4.5).values.length, 4);
  assert.equal(spec('levelNotes', 'בארבע כיתות יש 30, 31, 29 ו־28 תלמידים. מה מספר התלמידים הממוצע לכיתה?', 29.5).floor, 28);
  const b = ev('levelNotes', 'בקבוצת מספרים הקטן הוא 3 והממוצע הוא 7. האם הגדול יכול להיות 6? (כן/לא)', 'לא');
  assert.equal(stage(b, 'above').length, 3, 'the best case: at most three above the smallest');
  assert.equal(stage(b, 'target').length, 4, 'the mean asked for is four above it — out of reach');
});

test('only when the sounds give exactly the answer; TakeAwayTen keeps its place-value items', () => {
  assert.equal(spec('alternateDrums', '9 זוגי או אי־זוגי?', 'זוגי'), null, 'a wrong key is never set to sound');
  assert.equal(spec('levelNotes', 'הקשתם 4 פעמים: 80, 81, 82 ו־84 BPM. מה הקצב הממוצע?', 81.5), null);
  assert.equal(spec('nextBeat', '9 זוגי או אי־זוגי?', 'אי-זוגי'), null);
  assert.equal(D.specForItem(null), null);
  banks.allItems().forEach((it) => assert.ok(!(TT.specForItem(it) && D.specForItem(it)), 'both play: ' + it.prompt));
});

test('the bank: data items of grades 2–6 are heard; no answer — number or word — in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => D.specForItem(it));
  assert.ok(list.length >= 27, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['ב', 'ג', 'ד', 'ה', 'ו']);
  const word = (h, w) => new RegExp('(^|[\\s.,:;—>(])' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '($|[\\s.,:;—<)?])').test(h);
  list.forEach((it) => {
    const s = D.specForItem(it), h = D.html(s), a = String(it.answer);
    assert.ok(/^\d+$/.test(a) ? !(h.match(/\d+/g) || []).includes(a) : !word(h, a), 'leak: ' + it.prompt);
    assert.ok(D.longestRun(D.soundEvents(s)) <= D.MAX_RUN, 'run: ' + it.prompt);
    assert.match(D.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('alternateDrums', '9 זוגי או אי־זוגי?', 'אי-זוגי');
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = D.soundEvents(s).length;
  assert.deepEqual(D.play(s, env), { notes: n });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(D.play(s, {}), { notes: n, silent: true });
  assert.equal(D.play(null, env), null);
  assert.equal(D.html(null), '');
});

test('index.html renders the widget after TakeAwayTen and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_DATA_WORLDS\.play\(dw\)/);
  assert.match(html, /host\._dataSpec && typeof MM_DATA_WORLDS!=='undefined'/);
  assert.ok(html.indexOf("MM_TAKEAWAY_TEN.specForItem(item)") < html.indexOf("MM_DATA_WORLDS.specForItem(item)"));
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/dataWorlds\.js'/);
});
