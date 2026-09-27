const test = require('node:test');
const assert = require('node:assert');
const { isDecimalAnswer } = require('../src/lib/adaptive.js');

test('isDecimalAnswer returns true for 3.14 and false for 3/4', () => {
  assert.strictEqual(typeof isDecimalAnswer, 'function');
  assert.strictEqual(isDecimalAnswer('3.14'), true);
  assert.strictEqual(isDecimalAnswer('3/4'), false);
});
