const test = require('node:test');
const assert = require('node:assert/strict');

const strategy = require('../src/lib/mult4Strategy.js');

[
  [1, 4],
  [4, 16],
  [7, 28],
  [25, 100],
  [0, 0],
  [-3, -12],
  [-12, -48],
  [2.5, 10],
  [0.75, 3]
].forEach(([input, expected]) => {
  test(`multiplyBy4(${input}) returns ${expected}`, () => {
    assert.equal(strategy.multiplyBy4(input), expected);
  });
});

[
  null,
  undefined,
  NaN,
  Infinity,
  -Infinity,
  '4',
  'abc',
  true,
  false,
  {},
  [4]
].forEach((input) => {
  test(`multiplyBy4 rejects ${String(input)}`, () => {
    assert.equal(strategy.multiplyBy4(input), null);
  });
});

[
  [5, { step1: 10, step2: 20, result: 20 }],
  [0, { step1: 0, step2: 0, result: 0 }],
  [-3, { step1: -6, step2: -12, result: -12 }],
  [2.5, { step1: 5, step2: 10, result: 10 }]
].forEach(([input, expected]) => {
  test(`stepsFor(${input}) returns double-double steps`, () => {
    assert.deepEqual(strategy.stepsFor(input), expected);
  });
});

[ '4', null, undefined, NaN, Infinity, true ].forEach((input) => {
  test(`stepsFor rejects ${String(input)}`, () => {
    assert.equal(strategy.stepsFor(input), null);
  });
});

test('UMD exports multiplyBy4 and stepsFor functions', () => {
  assert.equal(typeof strategy.multiplyBy4, 'function');
  assert.equal(typeof strategy.stepsFor, 'function');
});
