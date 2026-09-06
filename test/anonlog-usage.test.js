const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('docs/ANONLOG_USAGE.md exists and mentions exerciseId / no PII', () => {
  const p = path.join(ROOT, 'docs/ANONLOG_USAGE.md');
  assert.ok(fs.existsSync(p), 'ANONLOG_USAGE.md missing');
  const md = read('docs/ANONLOG_USAGE.md');
  assert.match(md, /exerciseId/);
  assert.match(md, /no PII|No PII/i);
  assert.match(md, /anonLog\.js/);
});

test('ANONLOG_USAGE.md requires MelodyMath-partb when anonLog.js absent on master', () => {
  const md = read('docs/ANONLOG_USAGE.md');
  const hasLib = fs.existsSync(path.join(ROOT, 'src/lib/anonLog.js'));
  if (!hasLib) {
    assert.match(md, /MelodyMath-partb/);
    assert.match(md, /not.*on clean|not.*on clean `master`|Prerequisite/i);
  }
  assert.match(md, /record|exportEvents/);
});
