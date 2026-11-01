// Special education accessibility & Claude-inspired design tokens verification for all screens
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = [
  'index.html',
  'curriculum.html',
  'program.html',
  'frequency.html',
  'functions.html',
  '807.html',
  'check.html',
  'demo.html',
  'landing.html',
  'offer.html',
  'privacy.html'
];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('every HTML screen implements warm cream background #faf9f5 and terracotta accent', () => {
  for (const page of pages) {
    const html = read(page);
    // index.html gets tokens via src/sefirot.css and src/theme.css
    if (page === 'index.html') {
      const sefirot = read('src/sefirot.css');
      assert.match(sefirot, /#faf9f5/i);
      assert.match(sefirot, /#9a3412|#d97757/i);
      continue;
    }
    assert.match(html, /#faf9f5/i, page + ' must define warm cream background #faf9f5');
    assert.match(html, /#d97757|#9a3412/i, page + ' must define terracotta accent');
  }
});

test('every screen declares Hebrew RTL and Assistant/Heebo font', () => {
  for (const page of pages) {
    const html = read(page);
    assert.match(html, /dir="rtl"/i, page + ' must declare dir="rtl"');
    assert.match(html, /lang="he"/i, page + ' must declare lang="he"');
    if (page !== 'index.html') {
      assert.match(html, /Assistant|Heebo/i, page + ' must use Assistant or Heebo');
    }
  }
});

test('every screen supports dark mode via prefers-color-scheme', () => {
  for (const page of pages) {
    const html = read(page);
    if (page === 'index.html') {
      assert.match(read('src/sefirot.css'), /prefers-color-scheme:\s*dark/i);
      continue;
    }
    assert.match(html, /prefers-color-scheme:\s*dark/i, page + ' must include dark mode styles');
  }
});

test('every interactive button across screens meets special education 48px+ target minimum', () => {
  for (const page of pages) {
    const html = read(page);
    if (page === 'index.html' || page === 'privacy.html') continue; // index has theme tests; privacy has no buttons
    assert.match(html, /min-height:\s*(?:4[89]|5\d|6\d)px/i, page + ' must enforce 48px+ button min-height');
  }
});

test('no screen or component mentions Anthropic or includes Anthropic logos', () => {
  for (const page of pages) {
    const html = read(page);
    assert.doesNotMatch(html, /anthropic/i, page + ' must not mention Anthropic');
  }
});
