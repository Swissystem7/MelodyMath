'use strict';
// #591 audit item 6: a child with gaps in both starts with place value,
// then two-digit addition and subtraction.
const test = require('node:test');
const assert = require('node:assert/strict');
const { RM_ORDER } = require('../src/lib/banks');

test('place value is taught before addition and subtraction', () => {
  assert.ok(RM_ORDER.counting < RM_ORDER.place_value);
  assert.ok(RM_ORDER.place_value < RM_ORDER.addition);
  assert.ok(RM_ORDER.place_value < RM_ORDER.subtraction);
});
