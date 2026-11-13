'use strict';
// JumpLine: jumps on the empty number line (darbuka), two-step problems
// (Andalusian rows) and brackets (a piyyut refrain), heard.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const J = require('../src/lib/music/jumpLine');
const EB = require('../src/lib/music/earlyBeats');
const banks = require('../src/lib/banks');

const item = (music, grade, prompt, answer) => ({ music: music, grade: grade, prompt: prompt, answer: answer });
const spec = (...a) => J.specForItem(item(...a));
const ev = (...a) => J.soundEvents(spec(...a));
const worth = (list) => list.filter((n) => n.stage === 'jump').reduce((s, n) => s + n.worth, 0);

test('N10 jumps: dum = ten, tak = one; the start number is not a sound — only a short opening sign', () => {
  const e = ev('tenThenMore', 'ב', '28 + 46 = ?', 74);
  const start = e.filter((n) => n.stage === 'start');
  assert.equal(start.length, 2);
  assert.ok(start.every((n) => n.dur <= 0.12), 'the opening sign is short — it does not stand for 28');
  const jumps = e.filter((n) => n.stage === 'jump');
  assert.deepEqual(jumps.map((n) => n.worth), [10, 10, 10, 10, 1, 1, 1, 1, 1, 1], 'tens first, then ones');
  assert.equal(worth(e), 46);
});

test('direction is its own sign: forward rises, back falls — 28+46 and 74−46 do not sound the same', () => {
  const fwd = ev('tenThenMore', 'ב', '28 + 46 = ?', 74).filter((n) => n.stage === 'start');
  const back = ev('tensBarsBack', 'ב', '81 − 39 = ?', 42).filter((n) => n.stage === 'start');
  assert.ok(fwd[1].hz > fwd[0].hz);
  assert.ok(back[1].hz < back[0].hz);
  const tens = ev('tensBarsBack', 'ב', '81 − 39 = ?', 42).filter((n) => n.stage === 'jump' && n.worth === 10);
  assert.ok(tens[1].hz < tens[0].hz, 'the line moves back');
});

test('a silence keeps the kinds of jumps apart, and never more than nine of a kind', () => {
  const e = ev('callResponse', 'ב', 'בטיול השתתפו 130 תלמידי כיתה ד׳ ו־95 תלמידי כיתה ה׳. כמה תלמידים השתתפו בסך הכול?', 225);
  const tens = e.filter((n) => n.worth === 10), ones = e.filter((n) => n.worth === 1);
  assert.equal(tens.length, 9);
  assert.equal(ones.length, 5);
  assert.ok(ones[0].at - tens[tens.length - 1].at > 0.6, 'a real silence between tens and ones');
  assert.equal(spec('callResponse', 'ב', 'בהצגה הראשונה נכחו 180 צופים, ובשנייה 215. כמה צופים נכחו בסך הכול בשתי ההצגות?', 395), null, 'grade 2 has no hundred sound (Meta AI)');
});

test('hundreds from grade 3: a deep dum is a hundred', () => {
  const e = ev('groupsThenMore', 'ג', 'הצליל הראשון 220 Hz והשני 440 Hz. בכמה Hz גבוה התדר השני?', 220);
  assert.deepEqual(e.filter((n) => n.stage === 'jump').map((n) => n.worth), [100, 100, 10, 10]);
  assert.match(J.html(spec('groupsThenMore', 'ג', 'הצליל הראשון 220 Hz והשני 440 Hz. בכמה Hz גבוה התדר השני?', 220)), /דום עמוק = קפיצה של מאה/);
});

test('comparison counts up from the smaller number and ends on a stop sign; the difference is what the jumps are worth', () => {
  const s = spec('twoDrums', 'ב', 'בית ספר א׳ מונה 410 תלמידים ובית ספר ב׳ מונה 365. בכמה יותר תלמידים יש בבית ספר א׳?', 45);
  assert.equal(s.start, 365);
  const e = J.soundEvents(s);
  assert.equal(worth(e), 45);
  assert.equal(e[e.length - 1].stage, 'arrived');
  assert.match(J.html(s), /לא המקום שהגענו אליו/);
  assert.equal(spec('twoDrums', 'א', 'בכיתה א׳1 יש 20 תלמידים ובכיתה א׳2 יש 17. בכמה יותר תלמידים בא׳1?', 3).delta, 3, 'class names like א׳1 are not numbers');
});

test('two-step: a phrase per row with a silence between rows, a checkpoint to say the middle result, then the second step in its own voice', () => {
  const e = ev('groupsThenMore', 'ג', 'במופע 4 שורות של 6 נגנים, ועל הבמה עוד 5 זמרים. כמה מופיעים בסך הכול?', 29);
  assert.equal(new Set(e.filter((n) => n.stage === 'row').map((n) => n.group)).size, 4);
  assert.equal(e.filter((n) => n.stage === 'row').length, 24);
  const cp = e.findIndex((n) => n.stage === 'checkpoint');
  assert.ok(cp > 0 && e.slice(cp + 1).every((n) => n.stage === 'join' && n.voice === 'voiceAh'));
  const less = ev('groupsThenMore', 'ג', 'במקהלה 3 שורות של 7 זמרים. 5 זמרים יצאו להפסקה. כמה זמרים נשארו?', 16);
  assert.equal(less.filter((n) => n.stage === 'leave').length, 5);
  const from = spec('groupsThenMore', 'ג', 'לנגן היו 40 ₪. הוא קנה 4 מיתרים ב־6 ₪ כל אחד. כמה כסף נשאר לו?', 16);
  assert.equal(from.mid, 24);
  assert.match(J.html(from), /כמה נלקח/);
});

test('brackets: the refrain repeats whole, a leader\'s clap starts each repetition; without brackets the first number stands alone', () => {
  const plain = ev('barCount', 'ד', '2 + 3 × 4 = ?', 14);
  assert.equal(plain.filter((n) => n.stage === 'alone').length, 2);
  assert.equal(plain.filter((n) => n.stage === 'leader').length, 4);
  assert.equal(plain.filter((n) => n.stage === 'refrain').length, 12);
  const br = ev('barCount', 'ד', '(2 + 3) × 4 = ?', 20);
  assert.equal(br.filter((n) => n.stage === 'alone').length, 0);
  [0, 1, 2, 3].forEach((r) => assert.equal(br.filter((n) => n.stage === 'refrain' && n.rep === r).length, 5));
  assert.match(J.html(spec('barCount', 'ד', '(2 + 3) × 4 = ?', 20)), /סיכמנו שכפל קודם לחיבור/);
});

test('only when the sounds give exactly the answer; EarlyBeats keeps its small items', () => {
  assert.equal(spec('tenThenMore', 'ב', '28 + 46 = ?', 64), null, 'a wrong key is never set to sound');
  assert.equal(spec('barCount', 'ד', '48 : 6 : 2 = ?', 4), null);
  assert.equal(spec('nextBeat', 'ב', '28 + 46 = ?', 74), null);
  assert.equal(J.specForItem(Object.assign(item('tenThenMore', 'ב', '28 + 46 = ?', 74), { noMusic: true })), null);
  assert.equal(J.specForItem(null), null);
  banks.allItems().forEach((it) => assert.ok(!(EB.specForItem(it) && J.specForItem(it)), 'both play: ' + it.prompt));
});

test('the bank: jumps, two-step and brackets of grades 1–4 are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => J.specForItem(it));
  assert.ok(list.length >= 30, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['א', 'ב', 'ג', 'ד']);
  const kinds = new Set(list.map((it) => J.specForItem(it).kind));
  ['add', 'sub', 'compare', 'twoStep', 'brackets'].forEach((k) => assert.ok(kinds.has(k), k));
  list.forEach((it) => {
    const s = J.specForItem(it);
    assert.ok(!(J.html(s).match(/\d+/g) || []).includes(String(it.answer)), 'leak: ' + it.prompt);
    assert.ok(J.longestRun(J.soundEvents(s)) <= J.MAX_RUN, 'run: ' + it.prompt);
    assert.match(J.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('tenThenMore', 'ב', '28 + 46 = ?', 74);
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  const n = J.soundEvents(s).length;
  assert.deepEqual(J.play(s, env), { notes: n });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(J.play(s, {}), { notes: n, silent: true });
  assert.equal(J.play(null, env), null);
  assert.equal(J.html(null), '');
});

test('index.html renders the widget after EarlyBeats and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_JUMP_LINE\.play\(jl\)/);
  assert.match(html, /host\._jumpSpec && typeof MM_JUMP_LINE!=='undefined'/);
  assert.ok(html.indexOf("typeof MM_EARLY_BEATS!=='undefined' && MM_EARLY_BEATS.specForItem") < html.indexOf("typeof MM_JUMP_LINE!=='undefined' && MM_JUMP_LINE.specForItem"));
  assert.ok(html.indexOf('src/lib/music/earlyBeats.js') < html.indexOf('src/lib/music/jumpLine.js'), 'EarlyBeats loads first');
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/jumpLine\.js'/);
});
