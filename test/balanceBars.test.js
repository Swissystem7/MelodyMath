'use strict';
// #710: BalanceBars — equations and inequalities of ד׳–ה׳ as two bars that
// start together. It is the balanceBars way of א׳-ב׳ and extends fillBar;
// the no-music check comes last (#665). Answers are recomputed, not trusted.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const BB = require('../src/lib/music/balanceBars.js');
const S = require('../src/components/BalanceBarsScreen.js');
const FB = require('../src/lib/music/fractionBar.js');
const banks = require('../src/lib/banks.js');
const g4 = require('../src/lib/curriculum/grade4.js');
const g5 = require('../src/lib/curriculum/grade5.js');

test('a side reads like the bank prints it: commas, × and :, brackets — never eval', () => {
  assert.equal(BB.evalSide('2,500 + 4,500'), 7000);
  assert.equal(BB.evalSide('3 × (20 + 5)'), 75);
  assert.equal(BB.evalSide('3 × 20 + 5'), 65);
  assert.equal(BB.evalSide('48 : 6'), 8);
  assert.equal(BB.evalSide('600 − 100'), 500);
  assert.equal(BB.evalSide('☐ × 7', 8), 56);
  assert.equal(BB.evalSide('☐ × 7'), null, 'an empty ☐ has no value');
  assert.equal(BB.evalSide('alert(1)'), null);
  assert.equal(BB.evalSide('(3 + 4'), null);
});

test('the same way as the bank items, the same mechanism as fillBar', () => {
  assert.equal(BB.WAY, 'balanceBars');
  assert.equal(BB.MECHANISM, FB.MECHANISM);
  [g4, g5].forEach((g) => {
    const main = banks.primaryWays(g.music.EQ_INEQ);
    assert.deepEqual(main.map((w) => w[0]), [BB.WAY], 'one MAIN way per topic');
  });
  assert.equal(banks.mechanismOf(BB.WAY), banks.mechanismOf('fillBar'));
});

test('the partner is a registered instrument of the balance mechanism, not kora', () => {
  const INST = require('../src/lib/instruments.js');
  assert.equal(S.DEFAULT_INSTRUMENT, 'marimba');
  assert.equal(S.PARTNER, 'darbuka', 'fillBar\'s own instrument (FractionBarPad)');
  const p = INST.instrumentById(S.PARTNER);
  assert.ok(p, 'registered in instruments.js');
  assert.equal(p.mechanism, banks.mechanismOf(BB.WAY), 'same mechanism as balanceBars');
  assert.ok(!p.optional, 'not an optional weak-evidence instrument');
});

test('two bars start together: equal sides end together, the bigger one sounds on', () => {
  const eq = BB.balancePlan(500, 500, [S.DEFAULT_INSTRUMENT, S.PARTNER]);
  const ends = eq.filter((n) => n.end);
  assert.equal(ends.length, 2);
  assert.equal(ends[0].at, ends[1].at);
  assert.ok(eq.filter((n) => n.held).every((n) => n.at === 0 && n.dur === BB.BAR_SEC));
  const gt = BB.balancePlan(56, 55, ['a', 'b']);
  const end = (k) => gt.find((n) => n.end && n.side === k).at;
  assert.ok(end(0) > end(1), '56 sounds on after 55');
  assert.equal(end(0), BB.BAR_SEC, 'the bigger side is one bar');
  assert.deepEqual(gt.map((n) => n.at), gt.map((n) => n.at).slice().sort((a, b) => a - b), 'sorted for playNotes');
  assert.ok(gt.every((n) => n.hz >= 220), 'audible on a phone');
  assert.equal(BB.balancePlan(7000, 2500, ['a', 'b'], 0).filter((n) => n.side === 0).length, 0, 'the side with ☐ stays silent');
  assert.deepEqual(BB.balancePlan(0, 0), []);
});

test('fillBar on the balance: the missing or extra part of the bar, as an exact fraction', () => {
  assert.equal(BB.fillCheck('☐ + 2,500 = 7,000', 4500).status, 'exact');
  const under = BB.fillCheck('☐ + 2,500 = 7,000', 1000);
  assert.equal(under.status, 'under');
  assert.equal(under.diff, '1/2', '3,500 of 7,000: half a bar missing');
  assert.match(under.he, /^חסר 1\/2/);
  const over = BB.fillCheck('25 × 4 = 50 × ☐', 3);
  assert.equal(over.status, 'over');
  assert.equal(over.diff, '1/2');
  assert.equal(BB.fillCheck('☐ : 8 = 125', 'x').status, 'invalid');
});

test('every exercise and every no-music item holds with its answer', () => {
  BB.TARGETS.forEach((t) => {
    if (t.kind === 'sign') { assert.equal(BB.sides(t.expr).sign, t.answer, t.expr); return; }
    assert.equal(BB.sides(t.expr, t.answer).sign, '=', t.expr);
    assert.notEqual(BB.sides(t.expr, t.answer + 1).sign, '=', t.expr);
  });
  ['mm-cur-31', 'mm-cur-39'].forEach((id) => {
    const mine = BB.NO_MUSIC_CHECK_ITEMS.filter((it) => it.topic === id);
    assert.ok(mine.length >= 3, id);
    assert.ok(mine.some((it) => /[<>]/.test(it.expr)), id + ' has an inequality');
    assert.equal(BB.screenForTopic(id), 'bbCard');
    assert.ok(BB.TARGETS.some((t) => t.topic === id), id + ' is practised with music first');
  });
  BB.NO_MUSIC_CHECK_ITEMS.forEach((it) => {
    const p = BB.parse(it.expr);
    if (typeof it.answer === 'number') { assert.equal(BB.sides(it.expr, it.answer).sign, '=', it.id); return; }
    assert.equal(it.answer, BB.sides(it.expr).sign === p.op ? 'נכון' : 'לא נכון', it.id);
    assert.ok(it.prompt.endsWith(it.expr), it.id);
  });
  assert.equal(BB.screenForTopic('nope'), null);
});

test('the screen: solve by ear, then the no-music check last', () => {
  let st = S.createState(0, true);
  assert.equal(S.current(st).silent, 0, 'before a guess the ☐ bar is empty');
  assert.equal(S.check(st, '').status, 'wrong');
  const miss = S.check(st, '1000');
  assert.equal(miss.status, 'wrong');
  assert.match(miss.message, /חסר 1\/2 תיבה/);
  st = S.check(st, '4,500');
  assert.equal(st.status, 'right');
  assert.equal(S.current(st).left, S.current(st).right);
  const html = S.renderHtml(S.createState(0, true), ['מרימבה', 'דרבוקה']);
  assert.match(html, /data-act="play"/);
  assert.equal((html.match(/class="bb-side"/g) || []).length, 2);
  assert.doesNotMatch(S.renderHtml(S.createState(0, false), []), /data-act="play"/);
  const sign = BB.TARGETS.findIndex((t) => t.kind === 'sign');
  assert.match(S.renderHtml(S.createState(sign, true), []), /data-sign="&gt;"/);
  assert.equal(S.check(S.createState(sign, true), BB.TARGETS[sign].answer).status, 'right');
  const plain = S.createState(BB.TARGETS.length, true);
  const ph = S.renderHtml(plain, []);
  assert.match(ph, /בדיקה בלי מוזיקה/);
  assert.doesNotMatch(ph, /data-act="play"|data-sign/);
  const answers = {};
  BB.NO_MUSIC_CHECK_ITEMS.forEach((it) => { answers[it.id] = String(it.answer); });
  answers['bb-nm-31-1'] = '3,800';
  const done = S.checkPlain(plain, answers);
  assert.match(done.message, /^6 מתוך 6/);
  assert.equal(done.done, true);
});

test('BalanceBars is reachable: card in the music games tab, scripts after fractionBar, precache', () => {
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  assert.match(html, /id="musicGames"[\s\S]*id="bbCard"[\s\S]*#591 music games end/);
  assert.match(html, /music\/fractionBar\.js[\s\S]*music\/balanceBars\.js[\s\S]*BalanceBarsScreen\.js/);
  assert.match(html, /MM_BALANCE_BARS\.screenForTopic/);
  const sw = fs.readFileSync(require.resolve('../sw.js'), 'utf8');
  assert.ok(sw.includes('./src/lib/music/balanceBars.js') && sw.includes('./src/components/BalanceBarsScreen.js'));
});
