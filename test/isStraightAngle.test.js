const test = require('node:test');
const assert = require('node:assert');
const { isStraightAngle } = require('../src/lib/geometryShapes.js');

test('isStraightAngle asserts that isStraightAngle(180) returns true and isStraightAngle(90) returns false', () => {
  assert.strictEqual(typeof isStraightAngle, 'function');
  assert.strictEqual(isStraightAngle(180), true);
  assert.strictEqual(isStraightAngle(90), false);
});
