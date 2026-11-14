'use strict';
// TimesTable: the strategy sounds, never the whole count. a × b is a groups of
// b; a bundle is first heard equal to its beats, then bundles are counted.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const T = require('../src/lib/music/timesTable');
const banks = require('../src/lib/banks');

const G2 = 'כפולות 2, 4, 5 ו־10 עד סוף כיתה ב׳';
const G3 = 'לוח כפל 10×10 אחרי שליטה ב־2/4/5/10';
const item = (music, standard, prompt, answer) => ({ music: music, standard: standard, prompt: prompt, answer: answer });
const spec = (...a) => T.specForItem(item(...a));
const ev = (...a) => T.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);

test('9 × 9 is never 81 beats: a bundle is shown equal to its beats once, then bundles are counted', () => {
  const e = ev('repeatedBars', G3, '9 × 9 = ?', 81);
  assert.equal(stage(e, 'demoBeats').length, 9);
  assert.equal(stage(e, 'demoBundle').length, 1);
  assert.equal(stage(e, 'bundle').length, 9, 'nine bundles — the tenth slot is real silence');
  assert.ok(e.length < 30);
});

test('×5 is the ten-phrase and then its half; ×6 and ×7 are five bundles and a few more', () => {
  const five = ev('repeatedBars', G2, '5 × 7 = ?', 35);
  assert.equal(stage(five, 'tenPhrase').length, 10);
  assert.equal(stage(five, 'bundle').length, 5);
  const six = ev('repeatedBars', G3, '6 × 7 = ?', 42);
  assert.deepEqual(['five', 'more'].map((p) => stage(six, 'bundle').filter((n) => n.part === p).length), [5, 1]);
});

test('doubling is voices entering a round: one, two, four, eight', () => {
  const e = ev('repeatedBars', G3, '8 × 6 = ?', 48);
  assert.deepEqual([...new Set(stage(e, 'voices').map((n) => n.voices))], [1, 2, 4, 8]);
  const three = ev('repeatedBars', G3, '3 × 8 = ?', 24);
  assert.equal(stage(three, 'onemore').length, 1);
});

test('zero is a framed bar of real silence; one is a single framed group', () => {
  const z = ev('repeatedBars', G2, '0 × 8 = ?', 0);
  assert.equal(stage(z, 'barStart').length, 3);
  assert.equal(stage(z, 'frameBeats').length, 16, 'a bar of beats, a silent bar, a bar of beats');
  const one = ev('repeatedBars', G2, '1 × 7 = ?', 7);
  assert.equal(stage(one, 'group').length, 7);
  assert.equal(stage(one, 'barEnd').length, 1);
});

test('commutativity: the same time twice — only the accents move', () => {
  const e = ev('repeatedBars', G3, '7 × 4 = 4 × ☐', 7);
  const rows = stage(e, 'rowsAccent'), cols = stage(e, 'colsAccent');
  assert.equal(rows.length, 7);
  assert.equal(cols.length, 4);
  const span = (list) => (list[list.length - 1].at - list[0].at) * list.length / (list.length - 1);
  assert.ok(Math.abs(span(rows) - span(cols)) < 1e-6, 'the same total length');
});

test('the distributive split: every group heard as a bundle of five and a few single beats', () => {
  const e = ev('repeatedBars', G3, '8 × 7 = 8 × 5 + 8 × ☐', 2);
  assert.equal(stage(e, 'bigPart').length, 8);
  assert.equal(stage(e, 'smallPart').filter((n) => n.g === 0).length, 2);
});

test('bars: a waltz in 3/4 (strong, weak, weak) and a jig in 6/8 (two groups of three)', () => {
  const w = ev('meters', G3, 'כמה פעימות ב־7 תיבות של 3/4?', 21);
  assert.equal(stage(w, 'beat').filter((n) => n.strong).length, 7);
  const j = ev('meters', G3, 'כמה שמיניות ב־4 תיבות של 6/8?', 24);
  assert.equal(stage(j, 'beat').filter((n) => n.strong).length, 8);
  assert.equal(spec('meters', G3, 'במשקל 6/8, שמינית 36 — היא סוגרת תיבה? (כתבו כן או לא)', 'כן').value, 'כן');
});

test('an accented beat in 3/4, counted from 1 as musicians count: whole bars as bundles, then its own bar beat by beat', () => {
  const e = ev('meters', G3, 'במשקל 3/4 סופרים את כל הפעימות מההתחלה. פעימה 18 — היא מודגשת? (כתבו כן או לא)', 'לא');
  assert.equal(stage(e, 'barBundle').length, 5, 'five whole bars: beats 1–15');
  assert.deepEqual(stage(e, 'beat').map((n) => n.strong), [true, false, false], '16 strong, 17 and 18 weak');
  assert.equal(spec('meters', G3, 'במשקל 3/4 סופרים את כל הפעימות מההתחלה. פעימה 18 — היא מודגשת? (כתבו כן או לא)', 'כן'), null, 'counting from 0 is never set to sound');
});
test('only for the times-table standards, and only when the sounds give exactly the answer', () => {
  assert.equal(spec('repeatedBars', G3, '9 × 9 = ?', 80), null, 'a wrong key is never set to sound');
  assert.equal(spec('repeatedBars', 'כפל וחילוק במספר חד־ספרתי, גם במאונך; סימני התחלקות', '24 × 3 = ?', 72), null);
  assert.equal(T.specForItem(Object.assign(item('repeatedBars', G2, '4 × 2 = ?', 8), { widget: 'g2' })), null);
  assert.equal(T.specForItem(null), null);
});

test('the bank: the times-table items of grades 2–3 are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => T.specForItem(it));
  assert.ok(list.length >= 78, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['ב', 'ג']);
  const word = (h, w) => new RegExp('(^|[\\s.,:;—>(])' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '($|[\\s.,:;—<)?])').test(h);
  list.forEach((it) => {
    const s = T.specForItem(it), h = T.html(s), a = String(it.answer);
    assert.ok(/^\d+$/.test(a) ? !(h.match(/\d+/g) || []).includes(a) : !word(h, a), 'leak: ' + it.prompt);
    assert.ok(T.longestRun(T.soundEvents(s)) <= T.MAX_RUN, 'run: ' + it.prompt);
    assert.match(T.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('repeatedBars', G2, '4 × 2 = ?', 8);
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = T.soundEvents(s).length;
  assert.deepEqual(T.play(s, env), { notes: n });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(T.play(s, {}), { notes: n, silent: true });
  assert.equal(T.play(null, env), null);
  assert.equal(T.html(null), '');
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_TIMES_TABLE\.play\(tt\)/);
  assert.match(html, /host\._timesSpec && typeof MM_TIMES_TABLE!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/timesTable\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/timesTable\.js'/);
});
