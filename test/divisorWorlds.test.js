'use strict';
// DivisorWorlds: the strategy is heard, never the whole count — one full
// example once, then markers; one world for each kind of question.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const D = require('../src/lib/music/divisorWorlds');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer, standard) => ({ music: music, prompt: prompt, answer: answer, standard: standard || '' });
const spec = (...a) => D.specForItem(item(...a));
const ev = (...a) => D.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);
const LEFT = (n, k) => n + ' פעימות בתיבות של ' + k + ' — כמה תיבות שלמות, וכמה פעימות נשארות? (כתבו כמו 3 שארית 2)';

test('remainders (tala): one cycle in full, a sam for every whole bar, then the leftover strokes and real silence', () => {
  const e = ev('leftoverBeats', LEFT(22, 5), '4 שארית 2');
  assert.equal(stage(e, 'demoSam').length + stage(e, 'demoStroke').length, 5);
  assert.equal(stage(e, 'sam').length, 4);
  assert.equal(stage(e, 'left').length, 2);
  assert.ok(e.length < 22, 'never all 22 beats');
  const zero = ev('leftoverBeats', LEFT(16, 4), '4 שארית 0');
  assert.equal(stage(zero, 'left').length, 0);
  assert.equal(spec('leftoverBeats', LEFT(22, 5), '4 שארית 1'), null, 'a wrong key is never set to sound');
});

test('measurement division (banjo): one roll in full, then a pinch for every whole roll — never 56 notes', () => {
  const e = ev('phraseShare', '56 ÷ 7 = ?', 8, 'חילוק להכלה');
  assert.equal(stage(e, 'demoRoll').length, 7);
  assert.equal(stage(e, 'pinch').length, 8);
  assert.ok(e.length < 30);
  assert.equal(spec('phraseShare', '24 ÷ 6 = ?', 4, 'חילוק להכלה'), null, 'up to 40 notes stay with DivisionBeats');
  assert.equal(ev('phraseShare', '40 תווים ל־10 ילדים. כמה לכל אחד?', 4, 'חילוק להכלה').filter((n) => n.stage === 'pinch').length, 4);
});

test('divisors (steelpan): try from one to the middle; each divisor found rings, a square once', () => {
  const e = ev('meters', 'כמה מחלקים יש למספר 18 (כולל 1 ו־18)?', 6);
  assert.equal(stage(e, 'divisor').length, 6);
  assert.deepEqual([...new Set(stage(e, 'try').map((n) => n.a))], [1, 2, 3, 4]);
  assert.deepEqual(stage(e, 'divisor').map((n) => n.a), [1, 18, 2, 9, 3, 6]);
  const one = ev('meterGroups', 'האם 1 הוא מספר ראשוני? (כן/לא)', 'לא');
  assert.equal(stage(one, 'divisor').length, 1, 'one has a single divisor — a prime has exactly two');
  const even = ev('meterGroups', 'מהו המספר הראשוני הזוגי היחיד?', 2);
  assert.deepEqual([2, 4, 6].map((n) => stage(even, 'divisor').filter((x) => x.n === n).length), [2, 3, 4]);
});

test('rectangles (tango): a row left short is real silence; one long row is always a rectangle', () => {
  const e = ev('meterGroups', 'כמה מלבנים שונים, באורכי צלעות שלמים, אפשר לבנות מ־7 יחידות שטח ריבועיות? (1 × 7 ו־7 × 1 הם אותו מלבן)', 1);
  assert.equal(stage(e, 'found').length, 1);
  assert.deepEqual([...new Set(stage(e, 'rowStart').map((n) => n.k))], [2, 3, 7]);
  const g = ev('meterGroups', 'נתון: 23 × 9 = 207. האם 207 הוא מספר ראשוני? (כן/לא)', 'לא');
  assert.equal(stage(g, 'rowStart').length, 23);
  assert.equal(stage(g, 'unit').length, 9, 'one full row is heard, then rows');
  assert.equal(stage(g, 'found').length, 1);
});

test('factors (samul nori): each factor is that many strokes on its own instrument; the last one is what is left', () => {
  const e = ev('meterGroups', 'פרקו לגורמים ראשוניים: 12 = 2 × 2 × ☐. מה הגורם החסר?', 3);
  assert.equal(stage(e, 'whole').length, 12);
  assert.deepEqual(stage(e, 'split').map((n) => n.f), [2, 2, 2, 2]);
  assert.equal(stage(e, 'part').length, 6);
  assert.equal(stage(e, 'last').length, 3);
  const big = ev('meterGroups', 'מהו הגורם הראשוני הגדול ביותר של 84?', 7);
  assert.equal(stage(big, 'last').length, 7);
  assert.equal(new Set(big.filter((n) => n.stage === 'split' || n.stage === 'last').map((n) => n.gain)).size, 1, 'all equally loud');
});

test('divisibility (son): the tres plays only the ones for 5; the clave plays the digits for 3', () => {
  const five = ev('meterGroups', 'האם 645 מתחלק ב־5 בלי שארית? (כן/לא)', 'כן');
  assert.equal(stage(five, 'ones').length, 5);
  assert.equal(stage(five, 'closed').length, 1);
  const three = ev('meterGroups', 'האם 3,615 מתחלק ב־3 בלי שארית? (כן/לא)', 'כן');
  assert.equal(stage(three, 'digit').length, 15);
  assert.equal(stage(three, 'closed').length, 5);
  assert.equal(stage(three, 'demoTen').length, 10, 'a ten is three threes and one more');
});

test('parity (funk): every even multiple of three lands on the One and rings six', () => {
  const e = ev('stickingParity', 'מספר מתחלק ב־3 אבל לא ב־6. האם הוא יכול להיות זוגי? (כן/לא)', 'לא');
  assert.deepEqual(stage(e, 'one').map((n) => n.m), [6, 12]);
  assert.deepEqual(stage(e, 'six').map((n) => n.m), [6, 12]);
  assert.deepEqual(stage(e, 'and').map((n) => n.m), [3, 9]);
});

test('the largest prime below 30 walks 29 to the middle — only one and itself ring; two multiples of 3 make a 9', () => {
  const w = ev('meterGroups', 'מהו המספר הראשוני הגדול ביותר שקטן מ־30?', 29);
  assert.equal(stage(w, 'divisor').length, 2);
  assert.deepEqual([...new Set(stage(w, 'try').map((n) => n.a))], [1, 2, 3, 4, 5]);
  const t = ev('stickingParity', '219 ו־29,253 הם כפולות של 3. האם המכפלה שלהם מתחלקת ב־9? (כן/לא)', 'כן');
  assert.equal(stage(t, 'factor').length, 6);
  assert.equal(stage(t, 'nine').length, 9);
});
test('only for its tags and phrasings', () => {
  assert.equal(spec('meters', 'במשקל 3/4, פעימה 20 — היא מודגשת? (כתבו כן או לא)', 'לא'), null);
  assert.equal(spec('remainders', '56 ÷ 7 = ?', 8), null);
  assert.equal(D.specForItem(null), null);
});

test('the bank: grades 2–6 items are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => D.specForItem(it));
  assert.ok(list.length >= 28, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['ב', 'ג', 'ה', 'ו']);
  const word = (h, w) => new RegExp('(^|[\\s.,:;—>(])' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '($|[\\s.,:;—<)?])').test(h);
  list.forEach((it) => {
    const s = D.specForItem(it), h = D.html(s), a = String(it.answer);
    assert.ok(/^\d+$/.test(a) ? !(h.match(/\d+/g) || []).includes(a) : !word(h, a), 'leak: ' + it.prompt);
    assert.ok(D.longestRun(D.soundEvents(s)) <= D.MAX_RUN, 'run: ' + it.prompt);
    assert.match(D.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('leftoverBeats', LEFT(9, 4), '2 שארית 1');
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

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_DIVISOR_WORLDS\.play\(dw\)/);
  assert.match(html, /host\._divisorSpec && typeof MM_DIVISOR_WORLDS!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/divisorWorlds\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/divisorWorlds\.js'/);
});
