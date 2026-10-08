const test = require('node:test');
const assert = require('node:assert');
const { isProperFraction } = require('../src/lib/bar44.js');

test('isProperFraction identifies proper and improper fractions', () => {
  assert.strictEqual(typeof isProperFraction, 'function');
  assert.strictEqual(isProperFraction(3, 4), true);
  assert.strictEqual(isProperFraction(5, 4), false);
});
