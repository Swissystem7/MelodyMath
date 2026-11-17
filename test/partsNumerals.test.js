'use strict';
// PartsNumerals: every exercise makes one sound's worth audible before
// anything is counted — fractions, sharing, the whole from a part, Roman and
// Hebrew numerals, place value.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const P = require('../src/lib/music/partsNumerals');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const spec = (...a) => P.specForItem(item(...a));
const ev = (...a) => P.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);

test('a fraction model: three phrases in three timbres — the whole, the shaded part, the rest — never accents', () => {
  const e = ev('noteValues', 'מלבן מחולק ל־8 חלקים שווים, ו־3 מהם צבועים. איזה חלק מהמלבן צבוע? כתבו שבר.', '3/8');
  assert.equal(stage(e, 'whole').length, 8);
  assert.equal(stage(e, 'shaded').length, 3);
  assert.equal(stage(e, 'rest').length, 5, 'the part that is not shaded is heard, not silent');
  assert.equal(new Set(e.map((n) => n.gain)).size, 1);
});

test('the number line: a deep stamp lands on every whole number, a light step is one equal part', () => {
  const e = ev('noteValues', 'בישר המספרים, בין אילו שני מספרים שלמים נמצא 7/3? כתבו את הקטן מביניהם.', 2);
  assert.deepEqual(stage(e, 'wholeNumber').map((n) => n.n), [0, 1, 2]);
  const flag = stage(e, 'flag')[0], two = stage(e, 'wholeNumber')[2];
  assert.ok(flag.at > two.at, 'the seventh step lands after 2');
  const fifths = ev('noteValues', 'הקטע מ־0 עד 1 בישר המספרים מחולק ל־5 קטעים שווים. איזה שבר מתאים לשנתה השנייה אחרי 0?', '2/5');
  assert.equal(stage(fifths, 'step').length, 4);
  assert.equal(stage(fifths, 'flag')[0].i, 2);
});

test('a fraction as a quotient: every voice is a child, every pizza one round with one slice for each', () => {
  const e = ev('noteValues', 'מחלקים 3 פיצות שווה בשווה בין 4 ילדים. איזה חלק מפיצה מקבל כל ילד? כתבו שבר.', '3/4');
  assert.equal(stage(e, 'slice').filter((n) => n.kid === 0).length, 3);
  assert.equal(new Set(stage(e, 'slice').map((n) => n.round)).size, 3);
  assert.equal(stage(e, 'slice').filter((n) => n.round === 0).length, 4, 'a pizza is four slices');
});

test('25 m among 4: the leftover metre splits into four quarters first, then one share is heard', () => {
  const e = ev('noteValues', 'תופרת גוזרת סרט של 25 מטרים ל־4 חלקים שווים. מה אורך כל חלק במטרים? (שלם ושבר)', '6 ו־1/4');
  assert.equal(stage(e, 'quarter').length, 4);
  assert.equal(stage(e, 'metre').length, 6);
  assert.equal(stage(e, 'shareQuarter').length, 1);
});

test('the whole from a part: copies of 1/4; for 2/3 the part is split first, then the whole is built', () => {
  assert.equal(stage(ev('noteValues', 'הקטע הצבוע הוא 1/4 מרצועה, ואורכו 3 ס״מ. מה אורך הרצועה כולה בס״מ?', 12), 'copy').length, 12);
  const e = ev('noteValues', 'השטח הצבוע הוא 2/3 משטח מלבן, והוא 8 משבצות. מכמה משבצות בנוי המלבן כולו?', 12);
  assert.equal(stage(e, 'split').length, 1);
  assert.equal(stage(e, 'splitGroup').length, 8);
  assert.equal(stage(e, 'buildGroup').length, 12);
  assert.ok(stage(e, 'build')[0].at > stage(e, 'split')[0].at);
});

test('Roman numerals: a timbre per symbol, and an explicit minus before what is taken away', () => {
  const e = ev('romanGroupSymbols', 'בשיטה הרומית: איזה מספר הוא XIV?', 14);
  assert.deepEqual(e.map((n) => n.stage), ['symbol', 'minus', 'symbol', 'symbol']);
  assert.equal(P.romanValue('MMXXVI').total, 2026);
  assert.equal(stage(ev('romanGroupSymbols', 'בשיטה הרומית: איזה מספר הוא MMXXVI? (כתבו בלי פסיק)', 2026), 'minus').length, 0);
});

test('Hebrew letter numerals: an opening motif, then hundreds, tens and ones each on its own instrument', () => {
  const e = ev('romanGroupSymbols', 'בשיטת הא״ב: איזה מספר הוא קכ״ג?', 123);
  assert.equal(stage(e, 'frame').length, 3);
  assert.deepEqual([100, 10, 1].map((pl) => stage(e, 'letter').filter((n) => n.place === pl).length), [1, 2, 3]);
  assert.equal(new Set(stage(e, 'letter').map((n) => n.voice)).size, 3);
  assert.doesNotMatch(P.html(spec('romanGroupSymbols', 'בשיטת הא״ב: איזה מספר הוא קכ״ג?', 123)), /גימטריה|תפילה/);
});

test('place value: every place takes its turn, a zero is a turn with no notes', () => {
  const e = ev('romanGroupSymbols', 'במספר 217,800, מה ערך הספרה 7? (כתבו בלי פסיק)', 7000);
  assert.equal(stage(e, 'turn').length, 6);
  assert.deepEqual([5, 4, 3, 2, 1, 0].map((pl) => stage(e, 'beat').filter((n) => n.place === pl).length), [2, 1, 7, 8, 0, 0]);
});

test('only when the sounds give exactly the answer', () => {
  assert.equal(spec('noteValues', 'מלבן מחולק ל־8 חלקים שווים, ו־3 מהם צבועים. איזה חלק מהמלבן צבוע? כתבו שבר.', '3/5'), null, 'a wrong key is never set to sound');
  assert.equal(spec('romanGroupSymbols', 'כמה ספרות שונות יש בשיטה העשרונית?', 10), null);
  assert.equal(spec('nextBeat', 'בשיטה הרומית: איזה מספר הוא XIV?', 14), null);
  assert.equal(P.specForItem(null), null);
});

test('the bank: fractions and numeral systems of grades 5–6 are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => P.specForItem(it));
  assert.ok(list.length >= 12, 'played ' + list.length);
  list.forEach((it) => {
    const s = P.specForItem(it), h = P.html(s), a = String(it.answer);
    assert.ok(!h.includes(a), 'leak: ' + it.prompt);
    assert.ok(P.longestRun(P.soundEvents(s)) <= P.MAX_RUN, 'run: ' + it.prompt);
    assert.match(P.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('romanGroupSymbols', 'בשיטה הרומית: איזה מספר הוא XIV?', 14);
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  assert.deepEqual(P.play(s, env), { notes: 4 });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(P.play(s, {}), { notes: 4, silent: true });
  assert.equal(P.play(null, env), null);
  assert.equal(P.html(null), '');
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_PARTS_NUMERALS\.play\(pn\)/);
  assert.match(html, /host\._partsSpec && typeof MM_PARTS_NUMERALS!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/partsNumerals\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/partsNumerals\.js'/);
});
