'use strict';
// NoteBar: grade 4-6 fraction items heard as counted clicks in a locked bar.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const N = require('../src/lib/music/noteBar');
const banks = require('../src/lib/banks');

const item = (prompt, answer, music) => ({ prompt: prompt, answer: answer, music: music || 'fillBar' });
const played = () => banks.allItems().filter((it) => ['ד', 'ה', 'ו'].includes(it.grade) && N.specForItem(it));
const openText = (spec) => N.html(spec).replace(/data-reveal="[^"]*"/g, '').replace(/aria-label="[^"]*"/g, '').replace(/<[^>]+>/g, ' ');

test('1/2 + 1/3 is 3 clicks then 2 on a grid of 6, one slot left (Meta AI)', () => {
  const s = N.plan(item('1/2 + 1/3 = ?', '5/6'));
  assert.equal(s.kind, 'join');
  assert.equal(s.pulse, 6);
  const notes = N.soundEvents(s).filter((e) => e.stage === 'note');
  assert.deepEqual([0, 1].map((k) => notes.filter((e) => e.note === k).length), [3, 2]);
  assert.equal(notes.length, 5);
});

test('the bar is locked: every grid fits the same bar length, only the division changes', () => {
  ['1/2 + 1/4 = ?|3/4', '1/3 + 1/6 = ?|1/2', '1/8 + 3/16 = ?|5/16'].forEach((row) => {
    const [p, a] = row.split('|');
    const s = N.plan(item(p, a));
    assert.ok(s, p);
    const last = Math.max(...N.soundEvents(s).map((e) => e.at));
    assert.ok(last < N.BAR_SEC, p + ' runs past the bar: ' + last);
  });
});

test('one click sound per exercise; only the gong of a whole differs', () => {
  played().forEach((it) => {
    const s = N.specForItem(it);
    const voices = new Set(N.soundEvents(s).filter((e) => e.stage !== 'gong' && e.stage !== 'silentSlot').map((e) => e.voice));
    assert.equal(voices.size, 1, it.prompt);
  });
});

test('the widget shows only when the clicks give exactly the item answer', () => {
  assert.ok(N.plan(item('1/2 + 1/3 = ?', '5/6')));
  assert.equal(N.plan(item('1/2 + 1/3 = ?', '2/5')), null, 'a wrong answer key is never set to music');
  assert.equal(N.plan(item('1/2 + 1/3 = ?', '5/6', 'percentBar')), null, 'only note-duration ways');
  assert.equal(N.plan({ prompt: '1/2 + 1/3 = ?', answer: '5/6', music: 'fillBar', noMusic: true }), null);
});

test('equivalent fractions and simplifying: the same length in other notes', () => {
  const s = N.plan(item('השלימו: 1/2 = ?/8. מה המונה?', 4, 'noteValues'));
  assert.equal(s.kind, 'split');
  assert.equal(N.soundEvents(s).filter((e) => e.stage === 'unit').length, 4);
  const z = N.plan(item('צמצמו עד הסוף: 6/8', '3/4', 'noteValues'));
  const ev = N.soundEvents(z);
  assert.equal(ev.filter((e) => e.stage === 'unit').length, 6, 'six eighths');
  assert.equal(ev.filter((e) => e.stage === 'simple').length, 3, 'then three quarters');
});

test('a fraction of a quantity is a set of equal hits, not a length', () => {
  const s = N.plan(item('כמה זה 3/4 מ־20?', 15));
  assert.equal(s.kind, 'of');
  const ev = N.soundEvents(s);
  assert.equal(ev.length, 20);
  assert.equal(ev.filter((e) => e.stage === 'part').length, 15);
  const w = N.plan(item('1/3 מהתלמידים בכיתה הם 9 תלמידים. כמה תלמידים יש בכיתה?', 27));
  assert.equal(w.kind, 'ofWhole');
  assert.equal(N.soundEvents(w).filter((e) => e.stage === 'part').length, 9);
  assert.equal(N.plan(item('כמה זה 3/4 מ־40?', 30)), null, 'more than 24 hits cannot be counted by ear');
});

test('mixed numbers: a gong at every whole bar', () => {
  const s = N.plan(item('כתבו 7/4 כמספר מעורב (שלם ושבר)', '1 ו־3/4', 'dottedBeats'));
  assert.equal(s.kind, 'mixed');
  assert.equal(s.bars, 2);
  assert.equal(N.soundEvents(s).filter((e) => e.stage === 'gong').length, 2);
  assert.match(s.world.he, /גמלן/);
});

test('how much is missing: only in a 4/4 bar, the rest is silence', () => {
  const s = N.plan(item('תיבה של 4/4 מכילה רבע, שמינית ושמינית. כמה חסר עד תיבה מלאה? (כשבר)', '1/2', 'bars'));
  assert.equal(s.kind, 'missing');
  assert.equal(N.soundEvents(s).filter((e) => e.stage === 'note').length, s.pulse / 2);
  assert.equal(N.plan(item('בתיבה של 3/4 יש רבע ושתי שמיניות. כמה חסר עד תיבה מלאה? (כשבר)', '1/4', 'mixedBar')), null,
    'in 3/4 a quarter is a third of the bar: not taught here');
  assert.deepEqual(N.notesInWords('רבע ושתי שמיניות').map((f) => f.d), [4, 8, 8]);
});

test('division: how many notes of one length fit in another, and sharing into equal parts', () => {
  const f = N.plan(item('כמה שמיניות נכנסות בחצי? 1/2 : 1/8 = ?', 4, 'durationDiv'));
  assert.equal(f.kind, 'fit');
  assert.equal(new Set(N.soundEvents(f).filter((e) => e.stage === 'unit').map((e) => e.group)).size, 4);
  const w = N.plan(item('3 : 1/2 = ?', 6, 'barFill'));
  assert.equal(w.kind, 'fit');
  const s = N.plan(item('2/3 : 2 = ?', '1/3', 'barFill'));
  assert.equal(s.kind, 'share');
});

test('not played: fraction × fraction (needs a 2D grid), unhearable grids, long numbers, percent and decimals', () => {
  assert.equal(N.plan(item('2/3 × 3/4 = ?', '1/2', 'barFill')), null);
  assert.equal(N.plan(item('מה גדול יותר, 2/3 או 3/5? כתבו את השבר הגדול.', '2/3', 'splitNotes')), null);
  assert.equal(N.plan(item('כמה זה 1 ו־3/4 ועוד 2 ו־1/2? (שלם ושבר)', '4 ו־1/4')), null, 'more than 3 bars');
  assert.equal(N.plan(item('כמה זה 25% מ־20?', 5)), null);
  assert.equal(N.plan(item('0.3 + 0.4 = ?', 0.7)), null);
  assert.equal(N.plan(null), null);
});

test('the bank: dozens of grade 4-6 fraction items now heard, in several worlds, none showing its answer early', () => {
  const list = played();
  assert.ok(list.length >= 50, 'played ' + list.length);
  const topics = new Set(list.map((it) => it.grade + it.standard));
  assert.ok(topics.size >= 10, 'topics ' + topics.size);
  const worlds = new Set(list.map((it) => N.specForItem(it).world.he));
  assert.ok(worlds.size >= 5, 'worlds ' + worlds.size);
  list.forEach((it) => {
    assert.equal(banks.mechanismOf(it.music), 'M3', it.prompt);
    const s = N.specForItem(it);
    const a = String(s.answer).replace('/', '\\/');
    assert.ok(!new RegExp('(^|[^0-9/])' + a + '([^0-9/]|$)').test(openText(s)), it.prompt + ' shows ' + s.answer);
  });
});

test('the picture hides the answer, then shows it', () => {
  const s = N.plan(item('1/2 + 1/3 = ?', '5/6'));
  const open = N.html(s);
  assert.match(open, /data-reveal="5\/6"/);
  assert.match(open, /סופרים מכות/);
  assert.match(N.html(s, { revealed: true }), /class="snd-answer">5\/6</);
  assert.equal(N.html(null), '');
});

test('play uses the page audio and stays silent in Node', () => {
  const s = N.plan(item('1/4 + 2/4 = ?', '3/4'));
  const calls = [];
  const r = N.play(s, { audioContext: { currentTime: 0, state: 'running' }, playVoice: (ac, v) => calls.push(v) });
  assert.equal(r.notes, calls.length);
  assert.equal(N.play(s, {}).silent, true);
  assert.equal(N.play(null, {}), null);
});

test('index.html loads and draws the note bar, and sw.js precaches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /src="src\/lib\/music\/noteBar\.js"/);
  assert.match(html, /host\._noteBarSpec && typeof MM_NOTE_BAR!=='undefined'/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /noteBar\.js/);
});
