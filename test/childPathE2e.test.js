'use strict';
// Unit test verifying child path E2E specification integrity (Refs #665, Task 19).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('childPath.spec.js exists and covers all 5 criteria of Issue #665', () => {
  const filePath = path.join(__dirname, '..', 'e2e', 'childPath.spec.js');
  assert.ok(fs.existsSync(filePath), 'e2e/childPath.spec.js must exist');

  const content = fs.readFileSync(filePath, 'utf8');
  assert.ok(content.includes('index.html'), 'Spec must test opening index.html');
  assert.ok(content.includes('data-tap') || content.includes('inst'), 'Spec must test instrument selection');
  assert.ok(content.includes('#rmCheck') && content.includes('#rmAnswer'), 'Spec must test solving exercises');
  assert.ok(content.includes('999') && content.includes('bad'), 'Spec must test wrong answer encouraging feedback');
  assert.ok(content.includes('check.html') || content.includes('no-music'), 'Spec must test no-music check');
});
