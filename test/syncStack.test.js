const test = require('node:test');
const assert = require('node:assert/strict');
const sync = require('../src/lib/syncStack');

test('stackNumbers lists consecutive PR numbers in the #263 sync stack', () => {
  const stack = sync.stackNumbers(302, 315);
  assert.equal(stack.length, 14);
  assert.deepEqual(stack, [
    302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315,
  ]);
  assert.deepEqual(sync.stackNumbers(5, 5), [5]);
  assert.throws(() => sync.stackNumbers(5, 4), RangeError);
});

test('isByteIdentical compares string contents for the master∪main spot-check', () => {
  assert.equal(sync.isByteIdentical('abc', 'abc'), true);
  assert.equal(sync.isByteIdentical('abc', 'abd'), false);
  assert.throws(() => sync.isByteIdentical(1, 'a'), TypeError);
});

test('formatStackComment is the exact PASS or failing-check line for PR #315', () => {
  assert.equal(sync.formatStackComment('PASS'), 'PASS');
  assert.equal(
    sync.formatStackComment('FAIL', 'test/banks.test.js: assertion at line 12'),
    'test/banks.test.js: assertion at line 12',
  );
  assert.throws(() => sync.formatStackComment('MAYBE', 'x'), RangeError);
});

test('formatHandoff matches the issue #329 dell handoff line', () => {
  assert.equal(
    sync.formatHandoff(302, 315),
    'handoff: dell -> owner | review | stack #302-#315 checked | - | -',
  );
});
