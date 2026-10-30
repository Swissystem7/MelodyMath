'use strict';
// Guards for behavior merged in #723 (df67806, Refs #665). Deleting the
// implementation fails here even if test/fractionBar.test.js goes with it.
// balanceBars is the equality way: two sides last the same time. On master
// that way is fillBar ("שתי תיבות באותו אורך"). The unmerged #710 branch
// names the same way balanceBars; either tag keeps this guard green.
const test = require('node:test');
const assert = require('node:assert/strict');
const fb = require('../src/lib/music/fractionBar');
const banks = require('../src/lib/banks');
const g1 = require('../src/lib/curriculum/grade1');
const g2 = require('../src/lib/curriculum/grade2');
const g4 = require('../src/lib/curriculum/grade4');

const BALANCE_TAGS = ['balanceBars', 'fillBar'];

function balanceWay(file) {
  return (file.music.EQ_LEFT || []).find((w) => BALANCE_TAGS.includes(w[0]) && /שתי תיבות|אותו זמן/.test(w[1]));
}

test('fractions greater than 1 still span more than one bar (#723, df67806)', () => {
  assert.equal(fb.decimalToBarFraction(1.5), '3/2');
  assert.equal(fb.decimalToBarFraction(2.25), '9/4');
  assert.equal(fb.barFractionToDecimal('3/2'), 1.5);
  assert.ok(fb.barFractionToDecimal('3/2') > 1);
  assert.equal(fb.decimalToBarFraction(0.2), null);
  assert.equal(fb.decimalToBarFraction(4.1), null);
});

test('fillBar still checks 1.5 as one full bar plus a half (#723, df67806)', () => {
  const check = fb.checkFill(['whole', 'half'], 1.5);
  assert.equal(check.status, 'exact');
  assert.equal(check.sum, '3/2');
  assert.equal(check.diff, '0');
  assert.equal(banks.mechanismOf('fillBar'), 'M3');
  assert.ok(g4.music.FRAC_MIXED_D.some((w) => w[0] === 'fillBar'));
  const mixed = banks.itemsForGrade('ד').filter((it) => it.standard === banks.ST.FRAC_MIXED_D);
  assert.ok(mixed.length >= 1);
  mixed.forEach((it) => assert.equal(it.music, 'fillBar', it.id));
  const pad = require('../src/components/FractionBarPad.js');
  const ex = pad.EXERCISES.find((e) => e.target === '1.5');
  assert.ok(ex, 'FractionBarPad lost the multi-bar 1.5 exercise');
  assert.equal(fb.decimalToBarFraction(ex.target), '3/2');
});

test('balanceBars: an equality is still two bars of the same length', () => {
  [g1, g2].forEach((file) => {
    const way = balanceWay(file);
    assert.ok(way, file.grade + ' equality lost balanceBars/fillBar');
    assert.equal(banks.mechanismOf(way[0]), 'M3', file.grade);
  });
  [1, 2, 3, 4, 5, 6].forEach((n) => {
    const file = require('../src/lib/curriculum/grade' + n);
    Object.keys(file.music || {}).forEach((key) => {
      (file.music[key] || []).forEach((w) => {
        if (w[0] !== 'balanceBars') return;
        assert.equal(banks.mechanismOf('balanceBars'), 'M3', file.grade + ':' + key);
        assert.match(w[1], /שוויון|אותו זמן|שתי תיבות/);
      });
    });
  });
});
