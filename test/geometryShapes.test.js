const test = require('node:test');
const assert = require('node:assert/strict');
const geo = require('../src/lib/geometryShapes');

test('shape facts: sides and vertices by name', () => {
  assert.equal(geo.sidesOf('triangle'), 3);
  assert.equal(geo.sidesOf('square'), 4);
  assert.equal(geo.sidesOf('rectangle'), 4);
  assert.equal(geo.sidesOf('pentagon'), 5);
  assert.equal(geo.sidesOf('hexagon'), 6);
  assert.equal(geo.verticesOf('triangle'), 3);
  assert.equal(geo.verticesOf('hexagon'), 6);
  assert.equal(geo.shapeHe('triangle'), 'משולש');
});

test('namesForSides maps a side count back to shape names', () => {
  assert.deepEqual(geo.namesForSides(3), ['triangle']);
  assert.ok(geo.namesForSides(4).includes('square'));
  assert.ok(geo.namesForSides(4).includes('rectangle'));
});

test('isRightAngle is true only at exactly 90 degrees', () => {
  assert.equal(geo.isRightAngle(90), true);
  assert.equal(geo.isRightAngle('90'), true);
  assert.equal(geo.isRightAngle(89), false);
  assert.equal(geo.isRightAngle(180), false);
  assert.equal(geo.isRightAngle(45), false);
});
