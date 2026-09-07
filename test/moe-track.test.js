const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('MoE HOLD and track-split docs exist with required markers', () => {
  const moe = read('docs/MOE_HOLD.md');
  assert.match(moe, /HOLD/);
  assert.match(moe, /4000619547/);
  assert.match(moe, /UNVERIFIED/);

  const mapping = read('docs/digital-textbook-standard-mapping.md');
  assert.match(mapping, /DRAFT|טיוטה/);
  assert.match(mapping, /עומד/);
  assert.match(mapping, /חלקי/);
  assert.match(mapping, /לא עומד/);
  assert.match(mapping, /HOLD/);
  assert.match(mapping, /Base44|BASE44/);

  const boundary = read('docs/BASE44_BOUNDARY.md');
  assert.match(boundary, /HOLD|split|נפרד/i);
  assert.match(boundary, /PR #11|#11/);
  assert.match(boundary, /ai-lab/);

  const usage = read('docs/ANONLOG_USAGE.md');
  assert.match(usage, /anonLog|No PII/i);
  assert.doesNotMatch(usage, /MelodyMath-partb/i);

  const a11y = read('docs/a11y-checklist.md');
  const numbered = a11y.split(/\n/).filter((line) => /^\d+\.\s/.test(line.trim()));
  assert.ok(numbered.length >= 1, 'checklist should have numbered items');
  assert.ok(numbered.length <= 10, `a11y checklist must have ≤10 items, got ${numbered.length}`);
});

test('elementary product nav does not include ai-lab.html', () => {
  const index = read('index.html');
  const navMatch = index.match(
    /<nav class="more-nav" aria-label="דפים במוצר היסודי">([\s\S]*?)<\/nav>/
  );
  assert.ok(navMatch, 'expected elementary product nav');
  assert.doesNotMatch(navMatch[1], /ai-lab\.html/);
  assert.match(index, /mm-track-split/);
  assert.match(index, /מסלול נפרד/);
});

test('README marks Base44 as separate from MoE track', () => {
  const readme = read('README.md');
  assert.match(readme, /Base44/);
  assert.match(readme, /נפרד|separate|HOLD|split|לא מסלול משה/i);
  assert.match(readme, /docs\/BASE44_BOUNDARY\.md/);
  assert.match(readme, /docs\/MOE_HOLD\.md/);
});
