'use strict';
// TimeCycles: time units as nested cycles, one world per unit (grades ב׳–ד׳).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const T = require('../src/lib/music/timeCycles');
const banks = require('../src/lib/banks');

const item = (prompt, answer, music) => ({ prompt: prompt, answer: answer, music: music || 'hourTwelveGroups' });

test('an hour is 12 strokes of 5 minutes and closes on a low, different sound — never after 10', () => {
  const s = T.plan(item('כמה דקות יש ב־1 שעה?', 60));
  assert.equal(s.strokes, 12);
  const ev = T.soundEvents(s);
  const cycle = ev.filter((e) => e.stage === 'cycle');
  assert.equal(cycle.length, 1);
  assert.ok(cycle[0].hz < Math.min(...ev.filter((e) => e.stage === 'stroke').map((e) => e.hz)), 'low');
  assert.ok(cycle[0].dur > ev.find((e) => e.stage === 'stroke').dur, 'long');
  assert.equal(ev.filter((e) => e.stage === 'stroke').length, 12);
  assert.match(T.html(s), /לא אחרי 10 ולא אחרי 100/);
});

test('a quarter hour is a group of 3, with a pause before the next group', () => {
  const s = T.plan(item('כמה דקות יש ב־1 שעה?', 60));
  const at = T.soundEvents(s).filter((e) => e.stage === 'stroke').map((e) => e.at);
  const gaps = at.slice(1).map((x, i) => Math.round((x - at[i]) * 100));
  assert.ok(gaps[2] > gaps[0] && gaps[5] > gaps[3], 'a longer gap after every third stroke');
});

test('elapsed time across the hour: up to the hour, the hour sound, then on (4:30 → 6:00)', () => {
  const s = T.plan(item('האימון התחיל ב־4:30 ונגמר ב־6:00. כמה דקות נמשך?', 90));
  assert.equal(s.strokes, 18);
  assert.equal(s.startAt, 6);
  const ev = T.soundEvents(s);
  assert.equal(ev.filter((e) => e.stage === 'cycle').length, 2, '5:00 and 6:00');
  const firstCycle = ev.findIndex((e) => e.stage === 'cycle');
  assert.equal(ev.slice(0, firstCycle).filter((e) => e.stage === 'stroke').length, 6, 'six strokes to 5:00');
});

test('the week is 6 + 1: the seventh stroke is Shabbat in its own voice, no extra sound', () => {
  const s = T.plan(item('כמה ימים יש ב־3 שבועות?', 21, 'weekBars'));
  const ev = T.soundEvents(s);
  assert.equal(T.strokesHeard(s), 21);
  const shabbat = ev.filter((e) => e.shabbat);
  assert.equal(shabbat.length, 3);
  assert.ok(shabbat.every((e) => e.voice !== ev.find((x) => x.stage === 'stroke').voice));
  assert.match(s.world.he, /השבוע היהודי/);
});

test('a day is 12 of day and 12 of night, never 24 equal strokes', () => {
  const s = T.plan(item('כמה שעות יש ב־1 יממה?', 24, 'weekBars'));
  const strokes = T.soundEvents(s).filter((e) => e.stage === 'stroke');
  assert.equal(strokes.filter((e) => !e.night).length, 12);
  assert.equal(strokes.filter((e) => e.night).length, 12);
  assert.notEqual(strokes[0].voice, strokes[12].voice);
});

test('seconds: a ticking clock, a minute closes after 12 ticks of 5 seconds', () => {
  const s = T.plan(item('קטע של 90 שניות. כמה דקות ושניות? (כתבו כמו 1:30)', '1:30'));
  assert.equal(s.unit, 'sec');
  assert.equal(s.strokes, 18);
  assert.equal(T.cyclesClosed(s), 1);
  assert.match(s.world.he, /מתקתק/);
});

test('one world per unit, and gamelan is not used as a clock (Meta AI)', () => {
  const worlds = new Set(banks.allItems().filter((it) => T.specForItem(it)).map((it) => T.specForItem(it).world.he));
  assert.ok(worlds.size >= 5);
  Object.values(T.WORLDS).forEach((w) => assert.doesNotMatch(w.he + w.why, /גמלן|גונג אגנג/));
});

test('no run of more than 12 strokes without a pause, and the closing sound is a stop on a line', () => {
  banks.allItems().filter((it) => T.specForItem(it)).forEach((it) => {
    const s = T.specForItem(it);
    let run = 0, prev = null, max = 0;
    T.soundEvents(s).filter((e) => e.stage === 'stroke' || e.shabbat).forEach((e) => {
      if (prev !== null && e.at - prev > 0.3) run = 0;
      run++; max = Math.max(max, run); prev = e.at;
    });
    assert.ok(max <= 12, it.prompt + ' runs ' + max);
  });
  assert.match(T.html(T.plan(item('כמה דקות יש ב־3 שעות?', 180))), /תחנה בדרך, לא חזרה להתחלה/);
});

test('not played: 365 days, the Hebrew calendar, the clock-hand question, and wrong keys', () => {
  assert.equal(T.plan(item('כמה ימים יש בשנה לועזית רגילה, לא מעוברת?', 365, 'weekBars')), null);
  assert.equal(T.plan(item('בלוח העברי, כ׳ בחשוון — מה מספר היום בחודש?', 20, 'weekBars')), null);
  assert.equal(T.plan(item('כמה חודשים יש בשנה עברית מעוברת?', 13, 'weekBars')), null);
  assert.equal(T.plan(item('כמה דקות יש ב־1 שעה?', 100)), null, 'a wrong key is never set to sound');
  assert.equal(T.plan({ prompt: 'כמה דקות יש ב־1 שעה?', answer: 60, music: 'fillBar', noMusic: true }), null);
  assert.equal(T.plan(null), null);
});

test('the bank: about 26 time items heard, each answer equal to the strokes', () => {
  const list = banks.allItems().filter((it) => T.specForItem(it));
  assert.ok(list.length >= 24, 'played ' + list.length);
  list.forEach((it) => {
    const s = T.specForItem(it);
    assert.equal(s.answer, String(it.answer).trim(), it.prompt);
    assert.equal(banks.mechanismOf(it.music) === 'M2' || banks.mechanismOf(it.music) === 'M3', true, it.prompt);
  });
});

test('the picture hides the answer until it is given', () => {
  const s = T.plan(item('השיעור התחיל ב־8:00 ונגמר ב־8:45. כמה דקות נמשך?', 45));
  const open = T.html(s).replace(/data-reveal="[^"]*"/g, '').replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(open, /(^|[^0-9])45([^0-9]|$)/);
  assert.match(T.html(s, { revealed: true }), /class="snd-answer">45</);
});

test('index.html draws and reveals it; sw.js precaches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /src="src\/lib\/music\/timeCycles\.js"/);
  assert.match(html, /host\._timeSpec && typeof MM_TIME_CYCLES!=='undefined'/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /timeCycles\.js/);
  const s = T.plan(item('כמה דקות יש ברבע שעה?', 15));
  const calls = [];
  assert.equal(T.play(s, { audioContext: { currentTime: 0, state: 'running' }, playVoice: (ac, v) => calls.push(v) }).notes, calls.length);
  assert.equal(T.play(s, {}).silent, true);
});
