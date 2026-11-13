'use strict';
// PatternsUnits: patterns as body sounds evenly spaced with the unit never
// marked; units as fixed bundles (a maraca is a hundred, a trumpet is heard
// equal to ten maracas); the calendar as days and months, a crossing is silence.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const U = require('../src/lib/music/patternsUnits');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const spec = (...a) => U.specForItem(item(...a));
const ev = (...a) => U.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);

test('patterns: the smallest unit decides what comes next; the unit is never marked', () => {
  assert.equal(U.unitOf(['a', 'a', 'b', 'a', 'a']), 3);
  assert.equal(U.unitOf(['a', 'b', 'a', 'b']), 2);
  assert.equal(U.unitOf(['a', 'a', 'b', 'b', 'a', 'a'], 'AABB'), 4);
  assert.equal(U.unitOf(['a', 'b', 'b', 'a', 'b'], 'AAB'), 0, 'the letters must fit the sequence');
  const e = ev('fixedAccents', 'דגם AABB: 🥁 🥁 🔔 🔔 🥁 🥁 — מה הבא? (1=🥁, 2=🔔)', 2);
  assert.equal(e.length, 6, 'only the given sequence; the empty place is silence');
  const gaps = e.slice(1).map((n, i) => +(n.at - e[i].at).toFixed(3));
  assert.equal(new Set(gaps).size, 1, 'evenly spaced — no pause marks the unit');
  assert.equal(new Set(e.map((n) => n.gain)).size, 1, 'equally loud');
  assert.deepEqual(e.map((n) => n.sound), [0, 0, 1, 1, 0, 0]);
});

test('patterns: long is a clap and a beat of silence; "do mi do" asks for a name', () => {
  const e = ev('fixedAccents', 'דגם צלילי AAB: קצר, קצר, ארוך, קצר, קצר — מה הבא? (1=קצר, 2=ארוך)', 2);
  const gaps = e.slice(1).map((n, i) => +(n.at - e[i].at).toFixed(3));
  assert.ok(gaps[2] > gaps[0] * 1.9, 'the long one is followed by silence');
  assert.equal(spec('fixedAccents', 'דו, מי, דו — איזה צליל משלים את התבנית?', 'מי').value, 'מי');
  assert.equal(spec('fixedAccents', 'דגם AAB: 🥁 🥁 🔔 🥁 🥁 — מה הבא בתור? (1=🥁, 2=🔔)', 1), null, 'a wrong key is never set to sound');
});

test('units: a trumpet is first heard equal to ten maracas; then never a thousand sounds', () => {
  const e = ev('kiloGroupsTen', 'כמה מ״ל יש ב־3 ליטר?', 3000);
  assert.equal(stage(e, 'demoMaraca').length, 10);
  assert.equal(stage(e, 'demoTrumpet').length, 1);
  assert.equal(stage(e, 'trumpet').length, 3);
  const half = ev('kiloGroupsTen', 'כמה גרם יש בחצי ק״ג?', 500);
  assert.deepEqual([0, 1].map((p) => stage(half, 'half').filter((n) => n.part === p).length), [5, 5]);
  assert.equal(stage(ev('kiloGroupsTen', 'בבקבוק 1 ליטר ועוד 500 מ״ל. כמה מ״ל בסך הכול?', 1500), 'maraca').length, 5);
});

test('units: bags until the kilo is full; cups of half a litre; the difference after the silence', () => {
  assert.equal(stage(ev('kiloGroupsTen', 'שקית סוכר שוקלת 250 גרם. כמה שקיות נכנסות ב־1 ק״ג?', 4), 'bag').length, 4);
  const cups = ev('kiloGroupsTen', 'מזגנו 2 ליטר מים לכוסות של חצי ליטר. כמה כוסות מילאנו?', 4);
  assert.deepEqual([...new Set(stage(cups, 'cup').map((n) => n.cup))], [0, 1, 2, 3]);
  const d = ev('kiloGroupsTen', 'שק אחד שוקל 3 ק״ג ושק שני 5 ק״ג. בכמה ק״ג השני כבד יותר?', 2);
  assert.equal(stage(d, 'extra').length, 2);
});

test('volume: a cube and its millilitre at the same moment; a box layer by layer becomes a litre', () => {
  const same = ev('litreThousandGroups', 'כמה סמ״ק הם מ״ל אחד?', 1);
  assert.equal(same[0].at, same[1].at);
  const box = ev('litreThousandGroups', 'תיבה של 20 ס״מ על 10 ס״מ על 5 ס״מ מלאה מים. כמה ליטרים בתוכה?', 1);
  assert.equal(stage(box, 'layer').length, 10);
  assert.equal(stage(box, 'litre').length, 1);
});

test('calendar: months as long tones, a leap month after a silence; crossing a month is silence', () => {
  assert.equal(stage(ev('weekBars', 'כמה חודשים יש בשנה עברית מעוברת?', 13), 'month').length, 13);
  const c = ev('weekBars', 'חנוכה מתחיל בכ״ה בכסלו ונמשך 8 ימים. השנה יש בכסלו 30 ימים. באיזה יום בטבת חל היום השמיני?', 2);
  assert.deepEqual([0, 1].map((mo) => stage(c, 'day').filter((n) => n.month === mo).length), [6, 2]);
});

test('letters as numbers keep the app legend: violin for tens, flute for ones', () => {
  const t = ev('weekBars', 'ט״ו בשבט — מה מספר היום בחודש שבט?', 15);
  assert.equal(stage(t, 'letter').filter((n) => n.place === 1).length, 15);
  const l = ev('weekBars', 'ל״ג בעומר — איזה מספר הוא ל״ג?', 33);
  assert.deepEqual([10, 1].map((pl) => stage(l, 'letter').filter((n) => n.place === pl).length), [3, 3]);
});

test('the bank: items of grades 1, 4 and 6 are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => U.specForItem(it));
  assert.ok(list.length >= 27, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['א', 'ד', 'ו']);
  const word = (h, w) => new RegExp('(^|[\\s.,:;—>(])' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '($|[\\s.,:;—<)?])').test(h);
  list.forEach((it) => {
    const s = U.specForItem(it), h = U.html(s), a = String(it.answer);
    assert.ok(/^\d+$/.test(a) ? !(h.match(/\d+/g) || []).includes(a) : !word(h, a), 'leak: ' + it.prompt);
    assert.ok(U.longestRun(U.soundEvents(s)) <= U.MAX_RUN, 'run: ' + it.prompt);
    assert.match(U.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('fixedAccents', 'סדרה צורנית AB: ⭐ 🌙 ⭐ 🌙 — מה הבא? (1=⭐, 2=🌙)', 1);
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = U.soundEvents(s).length;
  assert.deepEqual(U.play(s, env), { notes: n });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(U.play(s, {}), { notes: n, silent: true });
  assert.equal(U.play(null, env), null);
  assert.equal(U.html(null), '');
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_PATTERNS_UNITS\.play\(pu\)/);
  assert.match(html, /host\._patSpec && typeof MM_PATTERNS_UNITS!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/patternsUnits\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/patternsUnits\.js'/);
});
