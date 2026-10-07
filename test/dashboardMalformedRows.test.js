const assert = require('node:assert');
const test = require('node:test');
const dashboardLogic = require('../src/lib/dashboardLogic.js');

const GOOD = { skill: 'חיבור', prompt: '3+4', answer: 7, given: 7, correct: true, at: 1010 };
const MISS = { skill: 'חיבור', prompt: '3+4', answer: 7, given: 8, correct: false, at: 1020 };

function roster(sessions) {
  return { classCode: 'a1', students: { 'נועה': { name: 'נועה', created: 1000, sessions: sessions } } };
}

test('allItems skips null sessions, non-array items and null items', () => {
  const student = {
    name: 'נועה',
    sessions: [
      null,
      'oops',
      { id: 's1', kind: 'practice', started: 1000, items: 'not-an-array' },
      { id: 's2', kind: 'practice', started: 2000, items: [null, GOOD, 5, MISS, undefined] },
      { id: 's3', kind: 'practice', started: 3000 },
    ],
  };
  assert.deepStrictEqual(dashboardLogic.allItems(student), [GOOD, MISS]);
  assert.deepStrictEqual(dashboardLogic.allItems(null), []);
  assert.deepStrictEqual(dashboardLogic.allItems({ sessions: 'x' }), []);
});

test('getDashboardData does not throw on a null session row and still counts the good rows', () => {
  const rows = dashboardLogic.getDashboardData(roster([
    null,
    { id: 's1', kind: 'practice', started: 1000, ended: 1100, items: [GOOD, MISS, MISS] },
  ]));
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].total, 3);
  assert.strictEqual(rows[0].correct, 1);
  assert.strictEqual(rows[0].sessions, 1, 'a null session row is not a session');
  assert.strictEqual(rows[0].lastAt, 1000);
  assert.strictEqual(rows[0].lastKind, 'practice');
  assert.strictEqual(rows[0].repeating, 1);
});

test('getDashboardData does not throw on null or non-object items inside a session', () => {
  const rows = dashboardLogic.getDashboardData(roster([
    { id: 's1', kind: 'plan', started: 1000, items: [null, GOOD, 'x', GOOD] },
  ]));
  assert.strictEqual(rows[0].total, 2);
  assert.strictEqual(rows[0].correct, 2);
  assert.strictEqual(rows[0].streak.best, 2);
});

test('getDashboardData does not throw when items is a string and reports an empty student', () => {
  const rows = dashboardLogic.getDashboardData(JSON.stringify(roster([
    { id: 's1', kind: 'practice', started: 1000, items: 'oops' },
  ])));
  assert.strictEqual(rows[0].total, 0);
  assert.strictEqual(rows[0].sessions, 1);
  assert.deepStrictEqual(rows[0].perSkill, []);
});

test('a trailing null session does not hide the real last session', () => {
  const rows = dashboardLogic.getDashboardData(roster([
    { id: 's1', kind: 'class', started: 500, items: [GOOD] },
    null,
  ]));
  assert.strictEqual(rows[0].lastAt, 500);
  assert.strictEqual(rows[0].lastKind, 'class');
});
