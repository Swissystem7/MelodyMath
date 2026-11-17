'use strict';
// DivisionBeats: the two meanings of division (grades ב׳–ג׳). Measurement is
// a drum path (count the booms); sharing is a hocket (count one player's notes).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const D = require('../src/lib/music/divisionBeats');
const banks = require('../src/lib/banks');

const SHARE = 'חילוק לחלקים', MEASURE = 'חילוק להכלה';
const item = (prompt, answer, standard) => ({ prompt: prompt, answer: answer, standard: standard, music: 'phraseShare' });

test('measurement: 12 beats, a boom closing every 3 — four booms', () => {
  const s = D.plan(item('12 עוגיות, 3 בכל צלחת. כמה צלחות?', 4, MEASURE));
  assert.equal(s.kind, 'measure');
  const ev = D.soundEvents(s);
  assert.equal(ev.filter((e) => e.stage === 'boom').length, 4);
  assert.equal(ev[ev.length - 1].stage, 'boom', 'the last boom closes the last group');
  assert.match(s.world.he, /שביל התוף/);
});

test('sharing: the melody in one voice first, then dealt in turn (hocket), never in blocks', () => {
  const s = D.plan(item('12 עוגיות ל־3 ילדים. כמה לכל אחד?', 4, SHARE));
  assert.equal(s.kind, 'share');
  const ev = D.soundEvents(s, 'whole');
  assert.equal(ev.filter((e) => e.stage === 'unison').length, 12);
  const hocket = ev.filter((e) => e.stage === 'hocket');
  assert.deepEqual(hocket.filter((e) => e.player === 0).map((e) => e.note), [0, 3, 6, 9], 'notes 1, 4, 7, 10 — interleaved');
  assert.ok(Math.max(...ev.filter((e) => e.stage === 'unison').map((e) => e.at)) < Math.min(...hocket.map((e) => e.at)));
});

test('sharing solo: player 1 loud, the others soft ghosts, same voice family', () => {
  const s = D.plan(item('12 עוגיות ל־3 ילדים. כמה לכל אחד?', 4, SHARE));
  const ev = D.soundEvents(s, 'solo');
  const mine = ev.filter((e) => e.stage === 'solo'), ghost = ev.filter((e) => e.stage === 'ghost');
  assert.equal(mine.length, 4);
  assert.equal(ghost.length, 8);
  assert.ok(Math.max(...ghost.map((e) => e.gain)) * 5 <= Math.min(...mine.map((e) => e.gain)));
  assert.equal(new Set(ev.map((e) => e.voice)).size, 1, 'one voice family: the players differ by turn, not instrument');
});

test('the two meanings use different worlds; siku only as the 2-player guest', () => {
  const share = D.plan(item('12 עוגיות ל־3 ילדים. כמה לכל אחד?', 4, SHARE));
  const measure = D.plan(item('12 עוגיות, 3 בכל צלחת. כמה צלחות?', 4, MEASURE));
  assert.notEqual(share.world.he, measure.world.he);
  assert.match(share.world.he, /באיאקה/);
  assert.match(share.world.why, /מסורת חיה/);
  assert.match(D.plan(item('10 עוגיות ל־2 ילדים, בשווה. כמה לכל אחד?', 5, SHARE)).world.he, /סיקו/);
  assert.match(D.plan(item('20 פעימות ל־4 ילדים. כמה לכל אחד?', 5, SHARE)).world.he, /באיאקה/);
});

test('0 : 5 is honest silence with empty trays; 8 : 1 is one player playing everything', () => {
  const zero = D.plan(item('0 ÷ 5 = ?', 0, SHARE));
  assert.equal(D.soundEvents(zero).length, 0);
  assert.equal((D.html(zero).match(/db-tray"/g) || []).length, 5);
  const one = D.plan(item('8 ÷ 1 = ?', 8, SHARE));
  assert.ok(D.soundEvents(one, 'solo').every((e) => e.stage === 'solo'));
  assert.doesNotMatch(D.html(one), /data-mode="solo"/, 'no solo button when there is only one player');
  assert.match(D.html(one), /אין חלוקה/);
});

test('the picture hides the answer: player 1 lights only after the solo (db-listened) or after the answer', () => {
  const s = D.plan(item('12 עוגיות ל־3 ילדים. כמה לכל אחד?', 4, SHARE));
  const open = D.html(s);
  assert.equal((open.match(/db-mine/g) || []).length, 4);
  assert.doesNotMatch(open, /nb-n0/);
  assert.match(D.html(s, { revealed: true }), /nb-n0/);
  const m = D.plan(item('12 עוגיות, 3 בכל צלחת. כמה צלחות?', 4, MEASURE));
  assert.doesNotMatch(D.html(m), /nb-barline/);
  assert.match(D.html(m, { revealed: true }), /nb-barline/);
});

test('the widget shows only for exact division the ear can follow', () => {
  assert.equal(D.plan(item('12 עוגיות ל־3 ילדים. כמה לכל אחד?', 5, SHARE)), null, 'a wrong key is never set to music');
  assert.equal(D.plan(item('50 ÷ 5 = ?', 10, MEASURE)), null, 'over 40 notes');
  assert.equal(D.plan(item('40 תווים ל־10 ילדים. כמה לכל אחד?', 4, SHARE)), null, 'more than 5 players');
  assert.equal(D.plan(item('12 ÷ 2 = ?', 6, 'כפל')), null, 'only the two division standards');
  assert.equal(D.plan({ prompt: '12 ÷ 2 = ?', answer: 6, standard: MEASURE, music: 'fillBar' }), null);
  assert.equal(D.plan(null), null);
});

test('the bank: grade 2-3 division items heard in both meanings, each answer equal to the notes', () => {
  const list = banks.allItems().filter((it) => D.specForItem(it));
  assert.ok(list.length >= 20, 'played ' + list.length);
  const kinds = new Set(list.map((it) => D.specForItem(it).kind));
  assert.deepEqual([...kinds].sort(), ['measure', 'share']);
  list.forEach((it) => {
    const s = D.specForItem(it);
    assert.equal(s.answer, it.answer, it.prompt);
    if (s.kind === 'measure') assert.equal(D.soundEvents(s).filter((e) => e.stage === 'boom').length, s.answer, it.prompt);
    else if (s.n > 0) assert.equal(D.soundEvents(s, 'solo').filter((e) => e.stage === 'solo').length, s.answer, it.prompt);
  });
});

test('play the chosen mode through the page audio; silent in Node', () => {
  const s = D.plan(item('12 עוגיות ל־3 ילדים. כמה לכל אחד?', 4, SHARE));
  const calls = [];
  assert.equal(D.play(s, { audioContext: { currentTime: 0, state: 'running' }, playVoice: (ac, v) => calls.push(v) }, 'solo').notes, 12);
  assert.equal(D.play(s, {}, 'whole').silent, true);
  assert.equal(D.play(null, {}), null);
});

test('index.html: buttons per mode, the solo lights player 1, reveal after the answer; sw.js precaches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /src="src\/lib\/music\/divisionBeats\.js"/);
  assert.match(html, /if\(mode==='solo'\)host\.classList\.add\('db-listened'\)/);
  assert.match(html, /\.db-listened \.db-mine\{/);
  assert.match(html, /host\._divSpec && typeof MM_DIVISION_BEATS!=='undefined'/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /divisionBeats\.js/);
});
