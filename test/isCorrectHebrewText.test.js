'use strict';
const assert = require('node:assert');
const { isCorrect } = require('../src/lib/adaptive');

// Test the new feature: handling Hebrew dash (־) and ASCII dash (-) in answers
// The feature should treat "אי זוגי" and "אי־זוגי" as equivalent to "אי-זוגי"
assert.strictEqual(isCorrect('אי זוגי', 'אי-זוגי'), true);
assert.strictEqual(isCorrect('אי־זוגי', 'אי-זוגי'), true);
assert.strictEqual(isCorrect('זוגי', 'אי-זוגי'), false);

// Ensure numeric/ratio paths are unchanged
assert.strictEqual(isCorrect('-12', -12), true);
assert.strictEqual(isCorrect('12', -12), false);
assert.strictEqual(isCorrect('3:2', '3:2'), true);
assert.strictEqual(isCorrect('', ''), false);
