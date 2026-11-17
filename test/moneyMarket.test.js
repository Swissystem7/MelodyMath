'use strict';
// MoneyMarket: shekels and agorot, heard. The piece and its value are two
// layers; change is counted up from the price; agorot gather into a shekel.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const M = require('../src/lib/music/moneyMarket');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const ev = (music, prompt, answer) => M.soundEvents(M.specForItem(item(music, prompt, answer)));
const worth = (list) => list.filter((n) => n.stage === 'value').reduce((s, n) => s + n.worth, 0);

test('a coin is ONE sound, and its value follows in a fixed code: click = 1, low thump = 10', () => {
  const e = ev('coinGroups', 'מטבע של 10 ₪ ושני מטבעות של 2 ₪. כמה ₪ ביחד?', 14);
  assert.equal(e.filter((n) => n.stage === 'piece').length, 3, 'three coins heard as three coins');
  assert.equal(worth(e), 14, 'the value layer adds up to the answer');
  assert.equal(e[0].stage, 'piece');
  assert.equal(e[1].voice, 'drumLow', 'the biggest coin first: one thump is ten');
});

test('a heavier coin sounds lower and longer; a bill rustles', () => {
  const s = M.specForItem(item('billBars', 'שטר של 50 ₪, שטר של 20 ₪ ומטבע של 2 ₪. כמה ₪ בסך הכול?', 72));
  const pcs = M.soundEvents(s).filter((n) => n.stage === 'piece');
  assert.deepEqual(pcs.map((n) => !!n.bill), [true, true, false]);
  const five = ev('coinGroups', 'מטבע של 5 ₪ ומטבע של 2 ₪. כמה ₪ ביחד?', 7).filter((n) => n.stage === 'piece');
  assert.ok(five[0].hz < five[1].hz && five[0].dur > five[1].dur);
});

test('value, not count: three 1-shekel coins against one 10-shekel coin', () => {
  const s = M.specForItem(item('billBars', 'לדנה 3 מטבעות של 1 ₪, ולרון מטבע אחד של 10 ₪. כמה ₪ יש למי שיש לו יותר כסף?', 10));
  assert.equal(s.kind, 'compare');
  const e = M.soundEvents(s);
  const side = (k) => e.filter((n) => n.side === k);
  assert.ok(side(0).filter((n) => n.stage === 'piece').length > side(1).filter((n) => n.stage === 'piece').length, 'more coins…');
  assert.ok(worth(side(1)) > worth(side(0)), '…less money');
  assert.match(M.html(s), /יותר צלילי מטבע לא אומר יותר כסף/);
});

test('change is counted UP from the price: one long price sound, ones to the next ten, then tens; a bell at the paid amount', () => {
  const e = ev('shekelHundredGroups', 'שילמנו 100 ₪ על קנייה של 64 ₪. כמה ₪ עודף?', 36);
  assert.equal(e[0].stage, 'price');
  assert.ok(e[0].dur > 2 * e[1].dur, 'the price is long — it is not a step');
  const steps = e.filter((n) => n.stage === 'step');
  assert.deepEqual(steps.map((n) => n.worth), [1, 1, 1, 1, 1, 1, 10, 10, 10]);
  assert.equal(steps.reduce((s, n) => s + n.worth, 0), 36, 'the change is the sum of the steps, not their number');
  assert.equal(e[e.length - 1].stage, 'paid');
  const ones = steps.filter((n) => n.worth === 1).map((n) => n.hz);
  assert.ok(ones.every((hz, i) => i === 0 || hz > ones[i - 1]), 'the seller\'s count rises');
});

test('change reads quantity × price and several purchases', () => {
  assert.equal(M.specForItem(item('agorotTenGroups', 'קנינו 4 עטים ב־6 ₪ כל אחד ושילמנו ב־50 ₪. כמה ₪ עודף?', 26)).price, 24);
  assert.equal(M.specForItem(item('billBars', 'למיה 110 ₪. היא קונה מחברת ב־11 ₪, ספר ב־37 ₪ וספר נוסף ב־49 ₪. כמה ₪ יישארו לה?', 13)).price, 97);
  assert.equal(M.specForItem(item('shekelHundredGroups', 'שילמנו 200 ₪ על 6 כרטיסים ב־30 ₪ כל אחד. כמה ₪ עודף?', 20)).tens, 2);
});

test('agorot: ten thin coins gather into one cup first (not counted); then each cup is a shekel', () => {
  const e = ev('shekelHundredGroups', 'כמה אגורות יש ב־8 ₪?', 800);
  assert.equal(e.filter((n) => n.stage === 'legend').length, 10);
  assert.equal(e.filter((n) => n.stage === 'legendCup').length, 1);
  const counted = e.filter((n) => n.stage === 'count');
  assert.equal(counted.length, 8);
  assert.equal(counted.reduce((s, n) => s + n.worth, 0), 800);
  const mixed = ev('shekelHundredGroups', 'כמה אגורות יש ב־12 ₪ ועוד 30 אגורות?', 1230).filter((n) => n.stage === 'count');
  assert.equal(mixed.reduce((s, n) => s + n.worth, 0), 1230);
});

test('2,300 agorot: two heavy bags of ten shekels and three cups — not 23 sounds in a row', () => {
  const counted = ev('agorotTenGroups', 'בקופה 2,300 אגורות. כמה ₪ זה?', 23).filter((n) => n.stage === 'count');
  assert.deepEqual(counted.map((n) => n.worth), [1000, 1000, 100, 100, 100]);
});

test('halves: every two half-shekel coins fill a cup', () => {
  const e = ev('agoraSkip', 'ארבעה מטבעות של 50 אגורות. כמה ₪ ביחד?', 2);
  assert.equal(e.filter((n) => n.stage === 'half').length, 4);
  assert.equal(e.filter((n) => n.stage === 'cup').length, 2);
});

test('fill: the same coin again and again until a bell at the amount', () => {
  const e = ev('coinGroups', 'כמה מטבעות של 2 ₪ שווים 10 ₪?', 5);
  assert.equal(e.filter((n) => n.stage === 'piece').length, 5);
  assert.equal(worth(e), 10);
  assert.equal(e[e.length - 1].stage, 'reached');
});

test('price × quantity: one bar per item, the same price in every bar', () => {
  const e = ev('shekelHundredGroups', 'חולצה עולה 45 ₪. כמה ₪ יעלו 3 חולצות?', 135);
  [0, 1, 2].forEach((b) => assert.equal(worth(e.filter((n) => n.bar === b)), 45));
});

test('sharing is dealt in rounds: each child gets one coin per round', () => {
  const s = M.specForItem(item('agorotTenGroups', 'חילקנו 60 ₪ שווה בשווה בין 4 ילדים. כמה ₪ לכל אחד?', 15));
  assert.equal(s.coin, 5);
  const e = M.soundEvents(s);
  assert.equal(e.length, 12);
  [0, 1, 2, 3].forEach((k) => assert.equal(e.filter((n) => n.kid === k).length, 3));
});

test('only when the sounds give exactly the answer; never more than 12 sounds in a row', () => {
  assert.equal(M.specForItem(item('coinGroups', 'מטבע של 5 ₪ ומטבע של 2 ₪. כמה ₪ ביחד?', 8)), null, 'a wrong key is never set to sound');
  assert.equal(M.specForItem(item('agorotTenGroups', 'קנייה של 24 ₪ ו־50 אגורות ועוד קנייה של 15 ₪ ו־50 אגורות. כמה ₪ בסך הכול?', 39)), null, 'two half-shekels are one more shekel, never forgotten');
  const hj = M.soundEvents(M.specForItem(item('agorotTenGroups', 'קנייה של 24 ₪ ו־50 אגורות ועוד קנייה של 15 ₪ ו־50 אגורות. כמה ₪ בסך הכול?', 40)));
  assert.equal(hj.filter((n) => n.stage === 'half').length, 2);
  assert.equal(hj.filter((n) => n.stage === 'cup').length, 1, 'the two halves fill one cup');
  assert.equal(M.specForItem(item('shekelHundredGroups', 'קנייה של 350 אגורות ועוד קנייה של 6 ₪ ו־50 אגורות. כמה ₪ בסך הכול?', 10)).a, 3);
  assert.equal(M.specForItem(item('nextBeat', 'מטבע של 5 ₪ ומטבע של 2 ₪. כמה ₪ ביחד?', 7)), null);
  assert.equal(M.specForItem(Object.assign(item('coinGroups', 'מטבע של 5 ₪ ומטבע של 2 ₪. כמה ₪ ביחד?', 7), { noMusic: true })), null);
  assert.equal(M.specForItem(null), null);
});

test('the bank: money items of grades 1–4 are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => M.specForItem(it));
  assert.ok(list.length >= 30, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['א', 'ב', 'ג', 'ד']);
  list.forEach((it) => {
    const s = M.specForItem(it);
    assert.ok(!(M.html(s).match(/\d+/g) || []).includes(String(it.answer)), 'leak: ' + it.prompt);
    assert.ok(M.longestRun(M.soundEvents(s)) <= M.MAX_RUN, 'run: ' + it.prompt);
    assert.match(M.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = M.specForItem(item('coinGroups', 'מטבע של 5 ₪ ומטבע של 2 ₪. כמה ₪ ביחד?', 7));
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 2, state: 'suspended', resume() { this.state = 'running'; } } };
  assert.deepEqual(M.play(s, env), { notes: 9 });
  assert.ok(calls.every((c) => c.when >= 2.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(M.play(s, {}), { notes: 9, silent: true });
  assert.equal(M.play(null, env), null);
  assert.equal(M.html(null), '');
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_MONEY_MARKET\.play\(mk\)/);
  assert.match(html, /host\._moneySpec && typeof MM_MONEY_MARKET!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/moneyMarket\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/moneyMarket\.js'/);
});
