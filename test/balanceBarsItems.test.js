'use strict';
// The BalanceBars adapter for bank items: the equals sign as balance, heard.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const B = require('../src/lib/music/balanceBars');
const banks = require('../src/lib/banks');

const item = (prompt, answer) => ({ prompt: prompt, answer: answer, music: 'balanceBars' });
const ends = (notes) => notes.filter((n) => n.end).map((n) => Math.round(n.at * 1000));

test('fill: the known side plays alone first, the ☐ side stays silent', () => {
  const s = B.specForItem(item('10 = 6 + ☐', 4));
  assert.equal(s.kind, 'fill');
  assert.equal(s.blankSide, 1);
  const known = B.itemNotes(s, 'known');
  assert.ok(known.every((n) => n.side === 0));
});

test('fill: the right number ends together with the known side, a wrong one does not', () => {
  const s = B.specForItem(item('10 = 6 + ☐', 4));
  const right = ends(B.itemNotes(s, 'try', '4'));
  assert.equal(new Set(right).size, 1, 'both sides end at the same moment');
  const wrong = ends(B.itemNotes(s, 'try', '16'));
  assert.equal(new Set(wrong).size, 2, '"16" — the answer comes next — ends apart');
});

test('non-standard formats are played as balance too: ☐ = 4 + 6 and 7 = ☐ − 3', () => {
  assert.ok(B.specForItem(item('☐ = 4 + 6', 10)));
  assert.ok(B.specForItem(item('7 = ☐ − 3', 10)));
  assert.ok(B.specForItem(item('השלימו: 25 × 4 = 50 × ☐', 2)));
});

test('truth: both sides; equal sides end together, a statement is checked against the key', () => {
  const s = B.specForItem(item('נכון או לא נכון: 300 + 200 = 600 − 100', 'נכון'));
  assert.equal(s.kind, 'truth');
  assert.equal(new Set(ends(B.itemNotes(s))).size, 1);
  assert.equal(B.specForItem(item('נכון או לא נכון: 300 + 200 = 600 − 100', 'לא נכון')), null, 'a wrong key is never set to sound');
});

test('zero is silence: 999 × 0 > 1 × 1 — one side is silent, the other keeps sounding', () => {
  const s = B.specForItem(item('נכון או לא נכון: 999 × 0 > 1 × 1', 'לא נכון'));
  const sideNotes = B.itemNotes(s).filter((n) => n.side != null);
  assert.ok(sideNotes.length > 0 && sideNotes.every((n) => n.side === 1));
});

test('the check always starts together after a count-in; only equality earns the bell and the shared chord (Meta AI)', () => {
  const s = B.specForItem(item('10 = 6 + ☐', 4));
  const right = B.itemNotes(s, 'try', '4'), wrong = B.itemNotes(s, 'try', '16');
  [right, wrong].forEach((notes) => {
    assert.equal(notes.filter((n) => n.stage === 'countIn').length, 3);
    const starts = notes.filter((n) => n.stage === 'side').map((n) => n.at);
    assert.equal(new Set(starts).size, 1, 'both voices start on one breath');
  });
  assert.equal(right.filter((n) => n.stage === 'bell').length, 1);
  assert.equal(right.filter((n) => n.stage === 'chord').length, 2);
  assert.equal(wrong.filter((n) => n.stage === 'bell' || n.stage === 'chord').length, 0, 'unequal: no resolution');
  assert.equal(B.itemNotes(s, 'known').filter((n) => n.stage === 'bell' || n.stage === 'countIn').length, 0, 'listening is not a check');
});

test('a quiet inner pulse makes the sides countable: 1 per tick up to 12, then tens, thousands', () => {
  const small = B.itemNotes(B.specForItem(item('10 = 6 + ☐', 4)), 'try', '4').filter((n) => n.stage === 'pulse');
  assert.equal(small.length, 10);
  assert.ok(small.every((n) => n.scale === 1 && n.gain < 0.1));
  const big = B.itemNotes(B.specForItem(item('נכון או לא נכון: 300 + 200 = 600 − 100', 'נכון'))).filter((n) => n.stage === 'pulse');
  assert.equal(big.length, 5);
  assert.equal(big[0].scale, 100);
});

test('when the ear cannot decide, the item is not played (83,580 vs 80,000; 56 vs 55)', () => {
  assert.equal(B.specForItem(item('נכון או לא נכון: 3,980 × 21 < 80,000', 'לא נכון')), null);
  assert.equal(B.specForItem(item('נכון או לא נכון: 8 × 7 > 50 + 5', 'נכון')), null);
  assert.equal(B.specForItem(item('מהו המספר השלם הגדול ביותר שמתאים ל־☐: ☐ × 7 < 50', 7)), null);
  assert.equal(B.specForItem({ prompt: '10 = 6 + ☐', answer: 4, music: 'fillBar' }), null);
  assert.equal(B.specForItem(null), null);
});

test('the picture: the ☐ side stays empty until the answer; the text says = is balance, not "the answer comes next"', () => {
  const s = B.specForItem(item('10 = 6 + ☐', 4));
  const open = B.itemHtml(s);
  assert.match(open, /width:0%/);
  assert.match(open, /שוויון הוא איזון/);
  assert.match(open, /data-mode="try"/);
  assert.match(open, /רק מקשיבים/);
  assert.match(open, /באך/);
  assert.doesNotMatch(B.itemHtml(s, { revealed: true }), /width:0%/);
});

test('the bank: the balance items of grades 1, 2, 4 and 5 are heard', () => {
  const list = banks.allItems().filter((it) => B.specForItem(it));
  assert.ok(list.length >= 25, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['א', 'ב', 'ד', 'ה']);
  list.forEach((it) => {
    const s = B.specForItem(it);
    if (s.kind === 'fill') assert.equal(new Set(ends(B.itemNotes(s, 'try', String(it.answer).replace(/,/g, '')))).size, 1, it.prompt);
  });
});

test('index.html plays the known side, the child’s number, or both, and reveals after the answer', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_BALANCE_BARS\.itemNotes\(bb, mode, guess\)/);
  assert.match(html, /host\._balanceSpec && typeof MM_BALANCE_BARS!=='undefined'/);
});
