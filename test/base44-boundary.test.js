const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function readIf(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

const PRODUCT_PATH_RE = /base44-youth|base44\/youth|truth-or-lie.*base44|base44.*truth.?or.?lie/i;

test('index.html and README do not link Base44 youth challenge as product path', () => {
  const blob = read('index.html') + '\n' + read('README.md');
  assert.doesNotMatch(blob, PRODUCT_PATH_RE);
});

test('docs/BASE44_BOUNDARY.md exists with HOLD/split language', () => {
  const md = read('docs/BASE44_BOUNDARY.md');
  assert.match(md, /HOLD/i);
  assert.match(md, /split/i);
  assert.match(md, /Base44/i);
  assert.match(md, /MoE|#11/i);
});

test('landing/offer (if present) do not sell Base44 youth as MelodyMath path', () => {
  const blob = readIf('landing.html') + '\n' + readIf('offer.html');
  if (!blob.trim()) return;
  assert.doesNotMatch(blob, PRODUCT_PATH_RE);
});
