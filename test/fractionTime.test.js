'use strict';
// FractionTime: durations in cumbia (a fixed grid is the ruler, the drum marks
// a note's start, size is the number of beats) and parts of a set in zydeco
// (washboard = one unit, accordion = one equal group). NoteBar keeps its items.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const F = require('../src/lib/music/fractionTime');
const NB = require('../src/lib/music/noteBar');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const spec = (...a) => F.specForItem(item(...a));
const ev = (...a) => F.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);

test('formats: reduced fractions and mixed numbers', () => {
  assert.equal(F.frac(6, 12), '1/2');
  assert.equal(F.frac(4, 2), '2');
  assert.equal(F.mixed(15, 4), '3 ו־3/4');
  assert.equal(F.mixed(5, 4), '1 ו־1/4');
});

test('comparing on one grid: the whole bar first, then each fraction as beats; more parts are shorter parts', () => {
  const e = ev('noteValues', 'איזה שבר גדול יותר: 1/3 או 1/5? כתבו את השבר.', '1/3');
  assert.equal(stage(e, 'ruler').length, 15);
  assert.deepEqual([0, 1].map((n) => stage(e, 'note').filter((x) => x.n === n).length), [5, 3]);
  assert.equal(new Set(e.filter((x) => x.stage === 'note').map((x) => x.gain)).size, 1, 'never louder for longer');
  assert.equal(spec('splitNotes', 'נועה אומרת ש־1/3 מעוגה קטן מ־1/4 מאותה עוגה, כי 3 קטן מ־4. האם היא צודקת? (כן/לא)', 'לא').value, 'לא');
  assert.equal(F.longestRun(e) <= F.MAX_RUN, true, 'fifteen beats get a breath after twelve');
});

test('adding and taking away only on the common grid; taking away is silence', () => {
  const a = ev('lcm', '1/2 + 1/3 = ?', '5/6');
  assert.equal(stage(a, 'ruler').length, 6);
  assert.equal(stage(a, 'first').length + stage(a, 'second').length, 5);
  const s = ev('roundBars', '5/6 − 3/8 = ?', '11/24');
  assert.equal(stage(s, 'first').length, 20);
  assert.equal(stage(s, 'left').length, 11);
  assert.equal(spec('lcm', '1/2 + 1/3 = ?', '2/5'), null, 'a wrong key is never set to sound');
});

test('a fraction of a fraction, a repeated note, the dot and the triplet', () => {
  const o = ev('noteLength', '1/2 × 1/3 = ?', '1/6');
  assert.equal(stage(o, 'inner').length, 2);
  assert.equal(stage(o, 'part').length, 1);
  const d = ev('dotted', 'רבע מנוקד הוא 1/4 × 3/2. איזה חלק מתיבה שלמה? (כשבר)', '3/8');
  assert.equal(stage(d, 'base').length, 2);
  assert.equal(stage(d, 'dot').length, 1, 'the dot is half of the note again');
  const t = ev('triplet', 'בשלישייה כל שמינית מתנגנת 2/3 מאורכה. 1/8 × 2/3 = ? (כשבר)', '1/12');
  assert.equal(stage(t, 'straight').length, 6);
  assert.equal(stage(t, 'tripletNote').length, 6, 'three triplet eighths in the time of two plain ones');
  assert.equal(stage(t, 'tripletNoteStart').length, 3);
});

test('measuring with dotted notes, a bar that is missing beats, mixed numbers in bars of four', () => {
  assert.equal(stage(ev('durationDiv', 'כמה רבעים מנוקדים (3/8) נכנסים בתיבה של 3/4? 3/4 : 3/8 = ?', 2), 'dottedStart').length, 2);
  const miss = ev('mixedBar', 'בתיבה של 3/4 יש רבע ושתי שמיניות. כמה חסר עד תיבה מלאה? (כשבר)', '1/4');
  assert.equal(stage(miss, 'empty').length, 2);
  const mix = ev('fillBar', 'שיר אחד נמשך 2 ו־1/2 דקות ושיר שני 1 ו־1/4 דקות. מה האורך הכולל? (שלם ושבר)', '3 ו־3/4');
  assert.equal(stage(mix, 'first').length + stage(mix, 'second').length, 15);
  const sub = ev('fillBar', 'מתוך הקלטה של 3 ו־1/2 דקות נמחקו 1 ו־1/4 דקות. כמה נשאר? (שלם ושבר)', '2 ו־1/4');
  assert.equal(stage(sub, 'left').length, 9);
});

test('parts of a set (zydeco): one group in units first, then the equal groups, then the ones taken', () => {
  const e = ev('fillBar', 'בכיתה 30 ילדים, 2/5 מהם מנגנים. כמה ילדים מנגנים?', 12);
  assert.equal(stage(e, 'demoUnit').length, 6);
  assert.equal(stage(e, 'whole').length, 5);
  assert.equal(stage(e, 'take').length, 2);
  const w = ev('dayAsSong', '3/4 מהכיתה הם 21 תלמידים. כמה תלמידים בכיתה?', 28);
  assert.equal(stage(w, 'oneGroup').length, 7);
  assert.equal(stage(w, 'whole').length, 4);
  const c = ev('dayAsSong', 'בכל יום החתול אוכל 2/3 פחית. מה מספר הפחיות הקטן ביותר שיש לקנות לשבוע?', 5);
  assert.equal(stage(c, 'can').length, 4, 'four cans emptied, and two thirds left that still need a can');
  assert.equal(stage(c, 'eaten').length, 14);
});

test('NoteBar keeps its own items', () => {
  const its = banks.allItems().filter((it) => F.specForItem(it));
  its.forEach((it) => assert.equal(NB.specForItem(it), null, 'both play: ' + it.prompt));
  assert.ok(NB.specForItem(item('fillBar', '1/2 + 1/3 = ?', '5/6')), 'NoteBar plays this one');
  assert.equal(F.specForItem(item('fillBar', '1/2 + 1/3 = ?', '5/6')), null, 'so FractionTime leaves it');
});

test('the bank: grades 4–6 items are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => F.specForItem(it));
  assert.ok(list.length >= 32, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['ד', 'ה', 'ו']);
  const word = (h, w) => new RegExp('(^|[\\s.,:;—>(])' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '($|[\\s.,:;—<)?])').test(h);
  list.forEach((it) => {
    const s = F.specForItem(it), h = F.html(s), a = String(it.answer);
    assert.ok(/^\d+$/.test(a) ? !(h.match(/\d+/g) || []).includes(a) : !word(h, a) && h.indexOf(a) < 0, 'leak: ' + it.prompt);
    assert.ok(F.longestRun(F.soundEvents(s)) <= F.MAX_RUN, 'run: ' + it.prompt);
    assert.match(F.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('lcm', '1/2 + 1/3 = ?', '5/6');
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = F.soundEvents(s).length;
  assert.deepEqual(F.play(s, env), { notes: n });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(F.play(s, {}), { notes: n, silent: true });
  assert.equal(F.play(null, env), null);
  assert.equal(F.html(null), '');
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_FRACTION_TIME\.play\(ft\)/);
  assert.match(html, /host\._fracTimeSpec && typeof MM_FRACTION_TIME!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/fractionTime\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/fractionTime\.js'/);
});
