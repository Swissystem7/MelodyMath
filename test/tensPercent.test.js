'use strict';
// TensPercent: a ten stays a tombak gather in the whole app (bak = one, tom =
// ten, a deep tom = a hundred); percent blocks (reggae) always come with their
// tombak value.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const T = require('../src/lib/music/tensPercent');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer, extra) => Object.assign({ music: music, prompt: prompt, answer: answer }, extra || {});
const spec = (...a) => T.specForItem(item(...a));
const ev = (...a) => T.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);
const worth = (list) => list.reduce((s, n) => s + (n.worth || 0), 0);

test('crossing a ten: one more bak makes ten, which flip into a tom (and ten toms into a hundred)', () => {
  const e = ev('countOnBeats', '19, ואז המספר הבא?', 20);
  assert.equal(stage(e, 'gather').length, 10, 'ten baks gather into one tom — heard once first');
  assert.equal(worth(stage(e, 'start')), 19);
  assert.equal(stage(e, 'flipTen').length, 1);
  assert.equal(worth(stage(e, 'result')), 20);
  const h = ev('countOnBeats', '99, ואז המספר הבא?', 100);
  assert.equal(stage(h, 'flipHundred').length, 1);
  assert.equal(stage(h, 'result').length, 1, 'a hundred is one deep tom, never a hundred sounds');
});

test('whole tens: toms only; what is taken away is silent in its own slot; zero is silence', () => {
  const e = ev('accentTens', '80 − 20 = ?', 60);
  assert.equal(stage(e, 'start').length, 8);
  assert.equal(stage(e, 'left').length, 6);
  assert.equal(stage(e, 'bak').length, 0);
  const h = ev('tensAccentJumps', '100 − 60 = ?', 40);
  assert.equal(stage(h, 'open').length, 10, 'a hundred opens into its ten toms');
  assert.equal(stage(h, 'left').length, 4);
  assert.equal(stage(ev('tensAccentJumps', '50 − 50 = ?', 0), 'left').length, 0);
});

test('the hundred chart: a row is a tom, a cell a bak; only items with nothing else to hear', () => {
  const e = ev('rowAccent', 'במספר 47 בלוח המאה: כמה עשרות נמוכות נשמעות?', 4);
  assert.equal(stage(e, 'number').filter((n) => n.worth === 10).length, 4);
  assert.equal(spec('rowAccent', 'בלוח המאה: 1 עשרת ו־8 יחידות — איזה מספר זה?', 18).value, 18);
  assert.equal(spec('rowAccent', 'בלוח המאה: 4 עשרות ו־2 יחידות — איזה מספר זה?', 42), null, 'DragPlace plays these');
  assert.equal(spec('accentTens', '80 − 20 = ?', 60, { hear: ['x'] }), null);
  assert.equal(spec('accentTens', '80 − 20 = ?', 60, { widget: 'g1' }), null);
});

test('percent: blocks with their tombak value — one block and its share — then all the blocks', () => {
  const e = ev('wholeFromTenth', '80% ממספר הם 120. מהו המספר?', 150);
  assert.equal(stage(e, 'given').length, 8, 'eight skanks: eight tenths');
  assert.equal(worth(stage(e, 'givenValue')), 120);
  assert.equal(worth(stage(e, 'share')), 15);
  assert.equal(stage(e, 'all').length, 10);
  assert.equal(worth(stage(e, 'whole')), 150);
  const q = ev('wholeFromTenth', '25% מהצבעים בקלמר הם 6 צבעים. כמה צבעים בקלמר?', 24);
  assert.equal(stage(q, 'all').length, 4, 'four drums: four quarters');
});

test('percent: what percent, a discount, a markup and a change', () => {
  const w = ev('wholeFromTenth', 'כמה אחוזים הם 12 מתוך 48? (מספר בלבד)', 25);
  assert.equal(stage(w, 'quarter').length, 4);
  assert.equal(worth(stage(w, 'share')), 12);
  const d = ev('shortenByPercent', 'חולצה עולה 80 ש״ח, ויש הנחה של 10%. כמה משלמים?', 72);
  assert.equal(worth(stage(d, 'off')), 8, 'a tenth of 80 is 8 — never 10');
  assert.equal(worth(stage(d, 'pay')), 72);
  const m = ev('shortenByPercent', 'מחיר של 50 ש״ח התייקר ב־20%. מה המחיר החדש?', 60);
  assert.equal(stage(m, 'tenth').length, 2);
  assert.equal(worth(stage(m, 'add')), 10);
  const c = ev('shortenByPercent', 'מחיר ירד מ־200 ש״ח ל־150 ש״ח. בכמה אחוזים ירד? (מספר בלבד)', 25);
  assert.equal(worth(stage(c, 'drop')), 50);
  assert.equal(worth(stage(c, 'quarterValue')), 50, 'the drop is one quarter of the price before');
});

test('the bank: grades 1, 2 and 6 items are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => T.specForItem(it));
  assert.ok(list.length >= 22, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['א', 'ב', 'ו']);
  list.forEach((it) => {
    const s = T.specForItem(it), h = T.html(s), a = String(it.answer);
    assert.ok(!(h.match(/\d+/g) || []).includes(a), 'leak: ' + it.prompt);
    assert.ok(T.longestRun(T.soundEvents(s)) <= T.MAX_RUN, 'run: ' + it.prompt);
    assert.match(T.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('countOnBeats', '29, ואז המספר הבא?', 30);
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
  assert.match(html, /MM_TENS_PERCENT\.play\(tp\)/);
  assert.match(html, /host\._tensPctSpec && typeof MM_TENS_PERCENT!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/tensPercent\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/tensPercent\.js'/);
});
