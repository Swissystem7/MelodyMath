const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('docs/MOE_HOLD.md exists with no verified tender and HOLD submission', () => {
  const p = path.join(ROOT, 'docs/MOE_HOLD.md');
  assert.ok(fs.existsSync(p), 'docs/MOE_HOLD.md missing');
  const md = fs.readFileSync(p, 'utf8');
  assert.match(md, /no verified tender|אין.*מכרז|No verified tender/i);
  assert.match(md, /HOLD/i);
  assert.match(md, /submission|הגשה|submit/i);
  assert.match(md, /MoE|Ministry of Education|משרד החינוך/i);
});
