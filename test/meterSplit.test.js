'use strict';
// MeterSplit: divisibility, divisors, primes and LCM heard as a locked cycle
// of equal beats (grades ה׳–ו׳).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const M = require('../src/lib/music/meterSplit');
const banks = require('../src/lib/banks');

const item = (prompt, answer, music) => ({ prompt: prompt, answer: answer, music: music || 'meters' });
const played = () => banks.allItems().filter((it) => M.specForItem(it));

test('a try closes when k divides n and breaks otherwise', () => {
  assert.deepEqual(M.tryGroups(12, 3), { n: 12, k: 3, groups: 4, left: 0, closes: true });
  assert.deepEqual(M.tryGroups(7, 3), { n: 7, k: 3, groups: 2, left: 1, closes: false });
});

test('7 is prime: every try from 2 to 6 breaks, and the child tries them one by one', () => {
  const s = M.plan(item('האם 7 הוא מספר ראשוני? (כן/לא)', 'כן', 'meterGroups'));
  assert.equal(s.kind, 'prime');
  assert.deepEqual(s.tries.map((t) => t.k), [2, 3, 4, 5, 6]);
  assert.ok(s.tries.every((t) => !t.closes));
  assert.equal((M.html(s).match(/data-try="/g) || []).length, 5, 'one button per try');
  const nine = M.plan(item('האם 9 הוא מספר ראשוני? (כן/לא)', 'לא', 'meterGroups'));
  assert.ok(nine.tries.some((t) => t.closes && t.k === 3));
});

test('primes use a neutral circle, never an unequal (aksak) world', () => {
  const s = M.plan(item('האם 7 הוא מספר ראשוני? (כן/לא)', 'כן', 'meterGroups'));
  assert.match(s.world.he, /מעגל/);
  assert.match(s.world.why, /לא נקרא חלוקה/);
  Object.values(M.WORLDS).forEach((w) => assert.doesNotMatch(w.he, /אקסאק|רופאק|7\/8/));
});

test('each try plays two rounds with a strong cycle start, so a broken group is heard at the seam', () => {
  const s = M.plan(item('האם 7 הוא מספר ראשוני? (כן/לא)', 'כן', 'meterGroups'));
  const ev = M.soundEvents(s, 2);   // groups of 4 in 7: 4 + 3
  assert.equal(ev.filter((e) => e.stage === 'start').length, 3, 'start of round 1, round 2 and the end');
  assert.equal(ev.filter((e) => e.stage !== 'start').length, 2 * 7 - 2);
  assert.ok(ev.some((e) => e.leftover), 'the broken group is marked');
  const starts = new Set(ev.filter((e) => e.stage === 'start').map((e) => e.voice));
  const others = new Set(ev.filter((e) => e.stage !== 'start').map((e) => e.voice));
  assert.ok([...starts].every((v) => !others.has(v)), 'the cycle start has its own sound');
});

test('the tempo is locked: every beat of every try lasts the same', () => {
  const s = M.plan(item('לכמה גדלים שונים של קבוצות שוות אפשר לחלק 12 פעימות, בלי קבוצה של פעימה אחת ובלי כל ה־12 יחד?', 4));
  s.tries.forEach((tr, i) => {
    const at = M.soundEvents(s, i).map((e) => e.at).sort((a, b) => a - b);
    const gaps = new Set(at.slice(1).map((x, j) => Math.round((x - at[j]) * 1000)).filter((g) => g > 0));
    assert.deepEqual([...gaps], [Math.round(M.STEP * 1000)], 'try ' + tr.k);
  });
  assert.equal(s.answer, 4);
  assert.match(s.world.he, /12/);
});

test('LCM: rows meet after 12 beats, counted from 0, with a third stronger sound', () => {
  const s = M.plan(item('תוף אחד מכה כל 4 פעימות ותוף שני כל 6 פעימות. אחרי כמה פעימות הם נפגשים?', 12, 'accentSkip'));
  assert.equal(s.kind, 'meet');
  const ev = M.soundEvents(s);
  const meet = ev.filter((e) => e.stage === 'meet');
  assert.equal(meet.length, 1);
  assert.equal(meet[0].beat, 12);
  assert.ok(meet[0].gain > Math.max(...ev.filter((e) => e.stage === 'row').map((e) => e.gain)), 'louder than the rows');
  assert.notEqual(meet[0].voice, ev.find((e) => e.stage === 'row').voice, 'a different sound: factor ≠ multiple');
  assert.equal(M.plan(item('תוף אחד מכה כל 7 פעימות ותוף שני כל 5 פעימות. אחרי כמה פעימות הם נפגשים?', 35, 'accentSkip')), null, 'over 24 beats is not heard');
});

test('which cycle splits into 3s: only one does', () => {
  const s = M.plan(item('תיבות של 5, 7, 9 ו־11 פעימות. איזו מהן אפשר לחלק לקבוצות שוות של 3?', 9));
  assert.equal(s.kind, 'whichSplits');
  assert.deepEqual(s.tries.map((t) => t.closes), [false, false, true, false]);
});

test('ear first: before the answer no try shows closed or broken; after it, every try does', () => {
  const s = M.plan(item('האם 9 הוא מספר ראשוני? (כן/לא)', 'לא', 'meterGroups'));
  const open = M.html(s);
  assert.doesNotMatch(open, /✓|✗|ms-broken/);
  const shown = M.html(s, { revealed: true });
  assert.equal((shown.match(/✓ נסגר|✗ נשבר/g) || []).length, s.tries.length);
  assert.match(shown, /ms-broken/);
  assert.equal(M.html(null), '');
});

test('the widget shows only when the beats give exactly the answer, and only for small numbers', () => {
  assert.equal(M.plan(item('האם 7 הוא מספר ראשוני? (כן/לא)', 'לא', 'meterGroups')), null);
  assert.equal(M.plan(item('האם 51 הוא מספר ראשוני? (כן/לא)', 'לא', 'meterGroups')), null);
  assert.equal(M.plan(item('האם 645 מתחלק ב־5 בלי שארית? (כן/לא)', 'כן', 'meterGroups')), null);
  assert.equal(M.plan({ prompt: 'האם 7 הוא מספר ראשוני? (כן/לא)', answer: 'כן', music: 'fillBar' }), null);
  assert.equal(M.plan({ prompt: 'האם 7 הוא מספר ראשוני? (כן/לא)', answer: 'כן', music: 'meterGroups', noMusic: true }), null);
  assert.equal(M.plan(null), null);
});

test('the bank: the grade 5 divisibility, prime and LCM items are heard, each answer equal to the beats', () => {
  const list = played();
  assert.ok(list.length >= 10, 'played ' + list.length);
  const kinds = new Set(list.map((it) => M.specForItem(it).kind));
  ['meet', 'groups', 'meters', 'prime', 'whichSplits'].forEach((k) => assert.ok(kinds.has(k), k));
  list.forEach((it) => {
    const s = M.specForItem(it);
    assert.equal(String(s.answer), String(it.answer), it.prompt);
    assert.equal(banks.mechanismOf(it.music), 'M2', it.prompt);
    const tries = s.kind === 'meet' ? 1 : s.tries.length;
    for (let i = 0; i < tries; i++) assert.ok(Math.max(...M.soundEvents(s, i).map((e) => e.at)) < 10, 'a try stays short');
  });
});

test('play uses the page audio for the chosen try and stays silent in Node', () => {
  const s = M.plan(item('האם 7 הוא מספר ראשוני? (כן/לא)', 'כן', 'meterGroups'));
  const calls = [];
  const r = M.play(s, { audioContext: { currentTime: 0, state: 'running' }, playVoice: (ac, v) => calls.push(v) }, 1);
  assert.equal(r.notes, calls.length);
  assert.equal(r.notes, 2 * 7 + 1);
  assert.equal(M.play(s, {}, 0).silent, true);
  assert.equal(M.play(null, {}), null);
});

test('index.html loads it after polyrhythm.js, plays the try the child picks, reveals it; sw.js precaches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.indexOf('src="src/lib/polyrhythm.js"') < html.indexOf('src="src/lib/music/meterSplit.js"'));
  assert.match(html, /MM_METER_SPLIT\.play\(ms, null, Number\(b\.getAttribute\('data-try'\)\)\)/);
  assert.match(html, /host\._meterSpec && typeof MM_METER_SPLIT!=='undefined'/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /meterSplit\.js/);
});
