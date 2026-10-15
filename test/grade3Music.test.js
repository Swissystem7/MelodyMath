'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { isCorrect, parseRemainderAnswer } = require('../src/lib/adaptive');
const banks = require('../src/lib/banks');

test('parseRemainderAnswer reads the forms a child types', () => {
  assert.deepEqual(parseRemainderAnswer('3 שארית 2'), { q: 3, r: 2 });
  assert.deepEqual(parseRemainderAnswer('3שארית2'), { q: 3, r: 2 });
  assert.deepEqual(parseRemainderAnswer('3, ושארית 2'), { q: 3, r: 2 });
  assert.deepEqual(parseRemainderAnswer('3 ש׳ 2'), { q: 3, r: 2 });
  assert.deepEqual(parseRemainderAnswer('3 r 2'), { q: 3, r: 2 });
  assert.equal(parseRemainderAnswer('32'), null);
  assert.equal(parseRemainderAnswer('3:2'), null);
  assert.equal(parseRemainderAnswer(''), null);
});

test('isCorrect checks quotient and remainder, not just the string', () => {
  assert.equal(isCorrect('3 ש 2', '3 שארית 2'), true);
  assert.equal(isCorrect('3 שארית 1', '3 שארית 2'), false);
  assert.equal(isCorrect('2 שארית 3', '3 שארית 2'), false);
  assert.equal(isCorrect('32', '3 שארית 2'), false);
  assert.equal(isCorrect('3', '3 שארית 2'), false);
  assert.equal(isCorrect('4', '4 שארית 0'), true);
  assert.equal(isCorrect('1:30', '1:30'), true);
});

test('every grade-ג leftover-beats item is arithmetically right', () => {
  const rows = banks.rowsOf('division', 'ג').filter((x) => x.music === 'leftoverBeats');
  assert.ok(rows.length >= 8);
  for (const it of rows) {
    const m = /^(\d+) פעימות בתיבות של (\d+)/.exec(it.prompt);
    const total = Number(m[1]);
    const bar = Number(m[2]);
    const a = parseRemainderAnswer(it.answer);
    assert.equal(a.q * bar + a.r, total, it.prompt);
    assert.ok(a.r < bar, it.prompt);
  }
});

test('step-grid items match rows x steps, and 3/6/7/8/9 items stay gated', () => {
  const grid = banks.rowsOf('measurement', 'ג').filter((x) => x.music === 'stepGrid');
  assert.ok(grid.length >= 6);
  for (const it of grid) {
    const cells = it.grid.rows * it.grid.steps;
    assert.ok(Number(it.answer) === cells || Number(it.answer) === it.grid.steps, it.prompt);
  }
  const music = ['multiplication', 'division', 'measurement', 'word_problems']
    .flatMap((sk) => banks.rowsOf(sk, 'ג')).filter((x) => x.music);
  for (const it of music) {
    const m = /(\d+) כפול (\d+)/.exec(it.hint || '');
    if (!m) continue;
    const hard = [3, 6, 7, 8, 9].filter((t) => t === Number(m[1]) || t === Number(m[2]));
    if (hard.length && ![2, 4, 5, 10].some((t) => t === Number(m[1]) || t === Number(m[2]))) {
      assert.ok(it.table, it.prompt + ' must carry a table for the gate');
    }
  }
});
