const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('docs/A11Y_INDEX.md exists and points to a11y-checklist', () => {
  const p = path.join(ROOT, 'docs/A11Y_INDEX.md');
  assert.ok(fs.existsSync(p), 'docs/A11Y_INDEX.md missing');
  const md = fs.readFileSync(p, 'utf8');
  assert.match(md, /a11y-checklist/);
  assert.match(md, /MelodyMath-partb|apply MelodyMath-partb/);
});

test('A11Y_INDEX.md says apply MelodyMath-partb if checklist missing', () => {
  const md = fs.readFileSync(path.join(ROOT, 'docs/A11Y_INDEX.md'), 'utf8');
  assert.match(md, /missing|absent|not include/i);
  assert.match(md, /apply MelodyMath-partb/);
});
