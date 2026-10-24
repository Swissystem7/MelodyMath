'use strict';
// #710: grades ד׳ and ה׳ get equations and inequalities (mm-cur-31, mm-cur-39),
// learned through the two-bar balance (balanceBars, which extends fillBar).
// Answers are recomputed here, not trusted.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');
const g4 = require('../src/lib/curriculum/grade4');
const g5 = require('../src/lib/curriculum/grade5');

const ST = banks.ST;
const TOPIC = { 'ד': 'mm-cur-31', 'ה': 'mm-cur-39' };
const mine = (grade) => banks.itemsForGrade(grade).filter((it) => it.standard === ST.EQ_INEQ);
const calc = (s) => Function('return (' + s.replace(/,/g, '').replace(/×/g, '*').replace(/:/g, '/').replace(/−/g, '-') + ')')();

['ד', 'ה'].forEach((grade) => {
  test('grade ' + grade + ': equations and inequalities at levels 1-3, tagged with ' + TOPIC[grade], () => {
    const items = mine(grade);
    assert.ok(items.length >= 9, grade + ' has ' + items.length);
    [1, 2, 3].forEach((lv) => assert.ok(items.some((it) => it.level === lv), grade + ' level ' + lv));
    assert.ok(items.some((it) => /[<>]/.test(it.prompt)), grade + ' has an inequality');
    const row = cur.MATRIX.find((r) => r.topicId === TOPIC[grade]);
    items.forEach((it) => {
      const s = cur.sectionForItem(it);
      assert.ok(s.verified, it.id);
      assert.equal(s.topic, row.topic, it.id);
      if (Number(it.answer) >= 1000) assert.match(it.prompt, /בלי פסיק/, it.id);
    });
  });

  test('grade ' + grade + ': every equation and inequality holds with its answer', () => {
    mine(grade).forEach((it) => {
      const expr = it.prompt.replace(/ \(כתבו בלי פסיק\)$/, '').replace(/^[^:]*: (?=[\d☐(])/, '').replace(/^[^:]*ל־☐: /, '');
      const [left, op, right] = expr.split(/ (=|<|>) /);
      if (/נכון/.test(it.prompt)) {
        const l = calc(left);
        const r = calc(right);
        const holds = op === '=' ? l === r : op === '<' ? l < r : l > r;
        assert.equal(it.answer, holds ? 'נכון' : 'לא נכון', it.id);
        return;
      }
      const at = (x) => [calc(left.replace('☐', x)), calc(right.replace('☐', x))];
      const [l, r] = at(it.answer);
      if (op === '=') { assert.equal(l, r, it.id); return; }
      const ok = (pair) => (op === '<' ? pair[0] < pair[1] : pair[0] > pair[1]);
      assert.ok(ok([l, r]), it.id);
      // The extreme whole number: one step further breaks the inequality.
      const next = /הגדול/.test(it.prompt) ? it.answer + 1 : it.answer - 1;
      assert.ok(!ok(at(next)), it.id);
    });
  });

  test('grade ' + grade + ': the balance is the primary way of level 1, fillBar follows', () => {
    const ways = (grade === 'ד' ? g4 : g5).music.EQ_INEQ;
    assert.deepEqual(ways.map((w) => w[0]), ['balanceBars', 'fillBar', 'sameLength']);
    assert.equal(banks.mechanismOf('balanceBars'), banks.mechanismOf('fillBar'));
    mine(grade).forEach((it) => assert.equal(it.music, ways[it.level - 1][0], it.id));
  });
});
