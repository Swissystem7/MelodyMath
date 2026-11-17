'use strict';
// MultiplyWorlds: multiplicative thinking, heard. The ear counts groups,
// not a total; ×10 changes the objects, not the number of sounds.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const M = require('../src/lib/music/multiplyWorlds');
const banks = require('../src/lib/banks');

const item = (music, standard, prompt, answer) => ({ music: music, standard: standard, prompt: prompt, answer: answer });
const TIMES = 'השוואה כפלית — פי כמה';
const TEN = 'כפל וחילוק ב־10, 100 ו־1,000';
const ONE = 'כפל וחילוק במספר חד־ספרתי, גם במאונך; סימני התחלקות';
const spec = (music, std, prompt, answer) => M.specForItem(item(music, std, prompt, answer));
const ev = (...a) => M.soundEvents(spec(...a));
const groupsOf = (list, stage) => new Set(list.filter((n) => n.stage === stage).map((n) => n.group)).size;

test('times as fast (gnawa-inspired): in the SAME span the fast part plays the phrase k times', () => {
  const e = ev('phraseFits', TIMES, 'מטרונום על 40, ואז על 200. פי כמה הוא מהיר יותר?', 5);
  assert.equal(groupsOf(e, 'slow'), 1);
  assert.equal(groupsOf(e, 'fast'), 5);
  const slow = e.filter((n) => n.stage === 'slow'), fast = e.filter((n) => n.stage === 'fast'), span = e.find((n) => n.stage === 'span');
  const slowSpan = 2 * (slow[1].at - slow[0].at);
  assert.ok(Math.abs(span.dur - slowSpan) < 1e-9, 'the fast part lives in the same span as the slow phrase');
  assert.ok(fast.every((n) => n.at >= span.at && n.at < span.at + span.dur));
});

test('times as high: a ladder of equal rungs from the low tone to the high one; pitch stays pitch', () => {
  const e = ev('phraseFits', TIMES, 'צליל של 110 הרץ וצליל של 440 הרץ — שתי אוקטבות. פי כמה התדר הגבוה?', 4);
  const rungs = e.filter((n) => n.stage === 'rung').map((n) => n.hz);
  assert.deepEqual(rungs, [110, 220, 330, 440], 'each rung is the low tone once more');
  assert.equal(e.find((n) => n.stage === 'high').hz, 440);
  assert.equal(spec('phraseFits', TIMES, 'תווה של 100 הרץ ותווה של 300 הרץ. פי כמה התדר הגבוה?', 3).k, 3);
});

test('times as long: the short song is one chorus; the long song is that chorus again and again', () => {
  const e = ev('phraseFits', TIMES, 'שיר אחד 10 תיבות, ושיר שני 50 תיבות. פי כמה השני ארוך?', 5);
  assert.equal(groupsOf(e, 'short'), 1);
  assert.equal(groupsOf(e, 'long'), 5);
});

test('times as many: one group, then the same group k times — groups and size are both audible', () => {
  const e = ev('phraseFits', 'שאלת השוואה כפלית — פי כמה', 'גיטרה מנגנת 8 תווים, ופסנתר מנגן פי 4 תווים. כמה תווים מנגן הפסנתר?', 32);
  assert.equal(e.filter((n) => n.stage === 'base').length, 8);
  assert.equal(groupsOf(e, 'times'), 4);
  [0, 1, 2, 3].forEach((g) => assert.equal(e.filter((n) => n.stage === 'times' && n.group === g).length, 8));
  assert.equal(e.find((n) => n.stage === 'base').voice, 'pluck');
  assert.equal(e.find((n) => n.stage === 'times').voice, 'keys');
});

test('×10 is not "add a zero": the same number of sounds, every object one package bigger', () => {
  const e = ev('tenfoldGroups', TEN, '45 × 10 = ?', 450);
  const before = e.filter((n) => n.stage === 'before'), after = e.filter((n) => n.stage === 'after');
  assert.equal(before.length, after.length);
  assert.deepEqual(before.map((n) => n.level + 1), after.map((n) => n.level));
  assert.equal(after.reduce((s, n) => s + n.worth, 0), 450);
  assert.equal(e.filter((n) => n.stage === 'machine').length, 1);
  const div = ev('tenfoldGroups', TEN, '4,800 : 100 = ?', 48);
  assert.equal(div.filter((n) => n.stage === 'machine').length, 2, ':100 is two steps back');
  assert.equal(div.filter((n) => n.stage === 'after').reduce((s, n) => s + n.worth, 0), 48);
});

test('vertical ×: ones first, a row per copy; ten objects are packed into one of the next kind (the carry)', () => {
  const e = ev('repeatedBars', ONE, '24 × 3 = ?', 72);
  const ones = e.filter((n) => n.stage === 'row' && n.level === 0);
  assert.equal(ones.length, 12);
  assert.equal(new Set(ones.map((n) => n.row)).size, 3);
  assert.equal(e.filter((n) => n.stage === 'pack').length, 1);
  assert.equal(e.filter((n) => n.stage === 'left').length, 2, 'two pencils stay in the ones column');
  assert.ok(e.findIndex((n) => n.stage === 'carried') > e.findIndex((n) => n.stage === 'pack'), 'the carried box arrives in the tens column');
  const tens = e.filter((n) => (n.stage === 'row' || n.stage === 'carried') && n.level === 1);
  assert.equal(tens.length, 7);
  const big = ev('repeatedBars', ONE, '300 × 4 = ? (כתבו בלי פסיק)', 1200);
  assert.equal(big.filter((n) => n.stage === 'packed' && n.level === 3).length, 1, 'ten cartons make one pallet');
});

test('division is dealt round by round in a hora circle; what cannot go round is unpacked', () => {
  const s = spec('repeatedBars', ONE, 'חשבו במאונך: 856 : 4', 214);
  const e = M.soundEvents(s);
  const toFirst = e.filter((n) => n.stage === 'deal' && n.kid === 0);
  assert.equal(toFirst.reduce((sum, n) => sum + n.worth, 0), 214, 'the first dancer receives the answer');
  assert.equal(e.filter((n) => n.stage === 'unpack').length, 1);
  assert.equal(e.filter((n) => n.stage === 'unpacked').length, 10, 'the first unpacking is heard in full: one box is ten pencils');
});

test('remainder: what is left outside the circle at the end', () => {
  const e = ev('repeatedBars', ONE, 'מהי השארית כשמחלקים 346 ב־3?', 1);
  assert.equal(e.filter((n) => n.stage === 'outside').length, 1);
  assert.match(M.html(spec('repeatedBars', ONE, 'מהי השארית כשמחלקים 346 ב־3?', 1)), /השארית/);
});

test('buses: full buses, then the students still waiting — the last bus is the child\'s decision', () => {
  const e = ev('repeatedBars', ONE, '307 תלמידים חוזרים באוטובוסים של 50 מקומות. מה מספר האוטובוסים הקטן ביותר שיש להזמין?', 7);
  assert.equal(e.filter((n) => n.stage === 'bus').length, 6);
  assert.equal(e.filter((n) => n.stage === 'waiting').length, 7);
  assert.equal(e[e.length - 1].stage, 'waiting', 'no seventh horn is played for the child');
});

test('divisible by 9: a click for every unit of each digit; a bell closes each circle of nine', () => {
  const s = spec('repeatedBars', ONE, 'האם 1,827 מתחלק ב־9 בלי שארית? (כן/לא)', 'כן');
  const e = M.soundEvents(s);
  assert.equal(e.filter((n) => n.stage === 'click').length, 18);
  assert.equal(e.filter((n) => n.stage === 'bell').length, 2);
  assert.equal(e[e.length - 1].stage, 'bell', 'the last click lands on a bell');
  assert.equal(spec('repeatedBars', ONE, 'האם 1,827 מתחלק ב־9 בלי שארית? (כן/לא)', 'לא'), null);
});

test('only when the sounds give exactly the answer; times tables of grades 2–3 are left to their own ways', () => {
  assert.equal(spec('tenfoldGroups', TEN, '45 × 10 = ?', 4510), null, 'a wrong key is never set to sound');
  assert.equal(spec('repeatedBars', ONE, 'חשבו במאונך: 237 × 4', 948), null, 'twenty-eight pencils in one column is too many');
  assert.equal(spec('repeatedBars', 'כפולות 2, 4, 5 ו־10 עד סוף כיתה ב׳', '4 × 2 = ?', 8), null);
  assert.equal(spec('nextBeat', TEN, '45 × 10 = ?', 450), null);
  assert.equal(M.specForItem(Object.assign(item('tenfoldGroups', TEN, '45 × 10 = ?', 450), { noMusic: true })), null);
  assert.equal(M.specForItem(null), null);
});

test('the bank: grades 3–4 multiplicative items are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => M.specForItem(it));
  assert.ok(list.length >= 24, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['ג', 'ד']);
  const kinds = new Set(list.map((it) => M.specForItem(it).kind));
  ['tempo', 'ladder', 'chorus', 'groups', 'pack', 'columns', 'deal', 'buses', 'circles'].forEach((k) => assert.ok(kinds.has(k), k));
  list.forEach((it) => {
    const s = M.specForItem(it);
    assert.ok(!(M.html(s).match(/\d+/g) || []).includes(String(it.answer)), 'leak: ' + it.prompt);
    assert.ok(M.longestRun(M.soundEvents(s)) <= M.MAX_RUN, 'run: ' + it.prompt);
    assert.match(M.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('tenfoldGroups', TEN, '45 × 10 = ?', 450);
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 3, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = M.soundEvents(s).length;
  assert.deepEqual(M.play(s, env), { notes: n });
  assert.equal(calls.length, n);
  assert.ok(calls.every((c) => c.when >= 3.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(M.play(s, {}), { notes: n, silent: true });
  assert.equal(M.play(null, env), null);
  assert.equal(M.html(null), '');
});

test('a big product in bundles: the group once in full, a gong equal to it, then a gong for every copy', () => {
  const e = M.soundEvents(M.specForItem({ music: 'phraseFits', standard: 'השוואה כפלית — פי כמה', prompt: 'דנה מתופפת 7 מכות, ויובל מתופף פי 6. כמה מכות מתופף יובל?', answer: 42 }));
  assert.equal(e.filter((n) => n.stage === 'base').length, 7);
  assert.equal(e.filter((n) => n.stage === 'bundleDemo').length, 1);
  assert.equal(e.filter((n) => n.stage === 'bundle').length, 6);
  assert.ok(e.length < 20, 'never 42 beats');
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_MULTIPLY_WORLDS\.play\(mw\)/);
  assert.match(html, /host\._multSpec && typeof MM_MULTIPLY_WORLDS!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/multiplyWorlds\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/multiplyWorlds\.js'/);
});
