'use strict';
// DecimalWorlds: the size of a decimal is heard as time and place, never as a
// number of sounds — "longer is larger" (0.45 > 0.5) is the trap.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const D = require('../src/lib/music/decimalWorlds');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const spec = (...a) => D.specForItem(item(...a));
const ev = (...a) => D.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);

test('tenths of a ten-beat cycle: seven beats sound, three are real silence', () => {
  const e = ev('tenthNotes', 'כתבו כשבר עשרוני: 7/10', '0.7');
  assert.equal(stage(e, 'beat').length, 7);
  assert.equal(stage(e, 'sam').length, 1);
});

test('places: one timbre per place, and a turn marker even where the digit is zero', () => {
  const e = ev('tenthNotes', 'במספר 3.46, איזו ספרה במקום המאיות?', 6);
  assert.deepEqual([0, -1, -2].map((pl) => stage(e, 'digit').filter((n) => n.place === pl).length), [3, 4, 6]);
  assert.equal(new Set(stage(e, 'digit').map((n) => n.voice)).size, 3);
  const thou = ev('tenthNotes', 'כתבו כשבר עשרוני: 3 אלפיות', '0.003');
  assert.equal(stage(thou, 'turn').length, 4, 'ones, tenths, hundredths and thousandths each take a turn');
  assert.equal(stage(thou, 'digit').length, 3);
});

test('comparing: one held tone per number, all starting together, the same stop marker — nothing to count (Meta AI)', () => {
  const e = ev('tenthNotes', 'מה גדול יותר, 0.5 או 0.45? כתבו את הגדול.', '0.5');
  const runs = stage(e, 'run'), stops = stage(e, 'stop');
  assert.equal(runs.length, 2, 'one sound per number — 0.45 cannot sound like "more"');
  assert.ok(runs.every((n) => n.at === 0), 'they start together');
  assert.equal(new Set(stops.map((n) => n.voice + n.hz)).size, 1, 'an identical stop marker');
  assert.ok(stops.find((n) => n.voiceIndex === 0).at > stops.find((n) => n.voiceIndex === 1).at);
  const tiny = ev('tenthNotes', 'מה גדול יותר, 0.09 או 0.1? כתבו את הגדול.', '0.1');
  const st = stage(tiny, 'stop');
  assert.ok(st.find((n) => n.voiceIndex === 1).at - st.find((n) => n.voiceIndex === 0).at >= 0.3, 'zoomed into the first tenth so the gap is audible');
  const order = stage(ev('tenthNotes', 'סדרו מהקטן לגדול: 0.6, 0.75, 0.5, 0.8. מהו המספר השני בסדר?', '0.6'), 'stop').sort((a, b) => a.at - b.at);
  assert.equal(order[1].voiceIndex, 0, 'the second stop is 0.6');
});

test('1/4: one pop beat sounds and three are silent; then the same moment in tenths and hundredths', () => {
  const e = ev('tenthNotes', 'כתבו כשבר עשרוני: 1/4', '0.25');
  assert.equal(stage(e, 'popBeat').length, 1);
  assert.equal(stage(e, 'decimal').length, 2);
  assert.equal(stage(e, 'decimalFine').length, 5);
});

test('beat length: a metronome inside a reference second cut into tenths', () => {
  const e = ev('tenthNotes', 'פעימה ב־120 BPM נמשכת 60/120 שנייה. כמה שניות זה כשבר עשרוני?', '0.5');
  const beats = stage(e, 'metronome'), tenths = e.filter((n) => n.stage === 'tenth' || n.stage === 'second');
  const gap = beats[1].at - beats[0].at, tick = tenths[1].at - tenths[0].at;
  assert.equal(Math.round(gap / tick), 5);
  assert.equal(spec('tenthNotes', 'פעימה נמשכת 0.5 שנייה. כמה פעימות בדקה (BPM)?', 120).value, '120');
});

test('× and : by powers of ten: the same number of sounds, every sound a place bigger or smaller', () => {
  const e = ev('tenthNotes', '36.5 : 100 = ?', '0.365');
  const before = stage(e, 'before'), after = stage(e, 'after');
  assert.equal(before.length, after.length);
  assert.deepEqual(before.map((n) => n.place - 2), after.map((n) => n.place));
  assert.equal(stage(e, 'swap').length, 2);
});

test('adding is a layer in the same timbre; taking away first breaks a whole into ten tenths', () => {
  const add = ev('tenthsTogether', '2.5 + 1.25 = ?', '3.75');
  assert.equal(add.filter((n) => (n.stage === 'layerA' || n.stage === 'layerB') && n.place === -1).length, 7);
  const sub = ev('tenthsTogether', '5 − 1.6 = ?', '3.4');
  assert.equal(stage(sub, 'broken').length, 10);
  assert.equal(stage(sub, 'takeTenth').length, 6);
  assert.deepEqual([0, -1].map((pl) => stage(sub, 'left').filter((n) => n.place === pl).length), [3, 4]);
});

test('change and differences are counted up, place by place', () => {
  const e = ev('tenthsTogether', 'שחיין א׳ סיים ב־23.42 שניות ושחיין ב׳ ב־23.18 שניות. בכמה שניות היה שחיין ב׳ מהיר יותר?', '0.24');
  assert.equal(Math.round(stage(e, 'step').reduce((s, n) => s + n.worth, 0) * 100), 24);
  assert.equal(Math.round(stage(ev('tenthsTogether', 'בכרטיס יש 50 ₪. קניתי מוצר שמחירו 18.55 ₪. כמה ₪ נשארו בכרטיס?', '31.45'), 'step').reduce((s, n) => s + n.worth, 0) * 100), 3145);
});

test('rounding: the distance down and the distance up — the shorter wins', () => {
  const e = ev('tenthsTogether', 'עגלו את 3.68 לעשיריות.', '3.7');
  assert.equal(stage(e, 'down').length, 8);
  assert.equal(stage(e, 'up').length, 2);
});

test('loops, parts of parts, sharing and fitting', () => {
  assert.equal(stage(ev('decimalNoteScale', '1.5 × 4 = ?', '6'), 'packedWhole').length, 2);
  const pp = ev('decimalNoteScale', '0.3 × 0.2 = ?', '0.06');
  assert.equal(stage(pp, 'split').length, 10);
  assert.equal(stage(pp, 'taken').length, 6);
  assert.equal(stage(ev('decimalNoteScale', '7.5 : 3 = ?', '2.5'), 'dealTenth').filter((n) => n.kid === 0).length, 5);
  assert.equal(new Set(stage(ev('decimalNoteScale', '2.4 : 0.4 = ?', '6'), 'tenth').map((n) => n.group)).size, 6);
});

test('intervals: the number plus its half is a fifth — then the two real tones together', () => {
  const e = ev('decimalNoteScale', 'קווינטה מעל לה של 440 הרץ: 440 × 1.5 = ?', '660');
  const hi = stage(e, 'toneHigh')[0], lo = stage(e, 'toneLow')[0];
  assert.equal(hi.hz / lo.hz, 1.5);
  assert.equal(spec('decimalNoteScale', 'טרצה גדולה היא פי 1.25. 400 × 1.25 = ?', '500').part, 4);
});

test('nearly whole: each number heard as its nearest whole with a small "a bit less / a bit more" sign', () => {
  const e = ev('nearlyWholeNote', 'בלי לחשב במדויק: האם 9.79 × 9.99 גדול מ־100? (כן/לא)', 'לא');
  assert.equal(stage(e, 'bitLess').length, 2);
  assert.equal(stage(e, 'limit').length, 1);
});

test('only when the sounds give exactly the answer', () => {
  assert.equal(spec('tenthNotes', 'מה גדול יותר, 0.5 או 0.45? כתבו את הגדול.', '0.45'), null, 'a wrong key is never set to sound');
  assert.equal(spec('nextBeat', 'כתבו כשבר עשרוני: 7/10', '0.7'), null);
  assert.equal(D.specForItem(null), null);
});

test('the bank: decimal items of grades 5–6 are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => D.specForItem(it));
  assert.ok(list.length >= 45, 'played ' + list.length);
  const word = (h, w) => new RegExp('(^|[\\s.,:;—>(])' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '($|[\\s.,:;—<)?])').test(h);
  list.forEach((it) => {
    const s = D.specForItem(it), h = D.html(s), a = String(it.answer);
    assert.ok(/^[\d./]+$/.test(a) ? !(h.match(/[\d./]+/g) || []).includes(a) : !word(h, a), 'leak: ' + it.prompt);
    assert.ok(D.longestRun(D.soundEvents(s)) <= D.MAX_RUN, 'run: ' + it.prompt);
    assert.match(D.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('tenthNotes', 'כתבו כשבר עשרוני: 7/10', '0.7');
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  assert.deepEqual(D.play(s, env), { notes: 8 });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(D.play(s, {}), { notes: 8, silent: true });
  assert.equal(D.play(null, env), null);
  assert.equal(D.html(null), '');
});

test('hundredths: a loop of copies in bundles packs into tenths; dealing breaks every tenth into hundredths', () => {
  const l = D.soundEvents(D.specForItem({ music: 'decimalNoteScale', prompt: '0.04 × 12 = ?', answer: '0.48' }));
  assert.equal(l.filter((n) => n.stage === 'copy').length, 12);
  assert.equal(l.filter((n) => n.stage === 'resultTenth').length, 4);
  assert.equal(l.filter((n) => n.stage === 'resultHundredth').length, 8);
  const d = D.soundEvents(D.specForItem({ music: 'decimalNoteScale', prompt: '0.32 : 4 = ?', answer: '0.08' }));
  assert.equal(d.filter((n) => n.stage === 'break').length, 3);
  assert.equal(d.filter((n) => n.stage === 'dealHundredth' && n.kid === 0).length, 8);
});
test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_DECIMAL_WORLDS\.play\(dw2\)/);
  assert.match(html, /host\._decimalSpec && typeof MM_DECIMAL_WORLDS!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/decimalWorlds\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/decimalWorlds\.js'/);
});
