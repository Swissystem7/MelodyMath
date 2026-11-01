// Neo-brutalist screen redesign tests for kids (#891 / redesign)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const theme = fs.readFileSync(path.join(root, 'src/theme.css'), 'utf8');
const sefirot = fs.readFileSync(path.join(root, 'src/sefirot.css'), 'utf8');

test('index.html header includes stars adornment and RTL language tag', () => {
  assert.match(indexHtml, /<html\s+lang="he"\s+dir="rtl">/);
  assert.match(indexHtml, /<span class="neo-header-stars"[^>]*>★ ★ ★<\/span>/);
});

test('theme.css applies chunky heading font to h1, h2, h3', () => {
  assert.match(theme, /h1\s*\{[^}]*font-family:\s*var\(--font-heading\)/);
  assert.match(theme, /h2\s*\{[^}]*font-family:\s*var\(--font-heading\)/);
  assert.match(theme, /h3\s*\{[^}]*font-family:\s*var\(--font-heading\)/);
});

test('theme.css applies neo-brutalist borders, rounded corners and hard shadows to cards and buttons', () => {
  // Cards
  assert.match(theme, /\.card[^}]*border-radius:\s*var\(--neo-radius\)/);
  assert.match(theme, /\.card[^}]*border:\s*var\(--neo-border\)/);
  assert.match(theme, /\.card[^}]*box-shadow:\s*var\(--neo-shadow\)/);

  // Buttons
  assert.match(theme, /button,\s*\.primary[^}]*border:\s*var\(--neo-border-2\)/);
  assert.match(theme, /button,\s*\.primary[^}]*box-shadow:\s*var\(--neo-shadow-sm\)/);
  assert.match(theme, /button:active:not\(:disabled\)\s*\{\s*transform:\s*translate\(2px,\s*2px\);\s*box-shadow:\s*var\(--neo-shadow-press\);/);
});

test('theme.css styles choices with neo-brutalist borders and press feedback', () => {
  assert.match(theme, /\.choice\s*\{[^}]*border:\s*var\(--neo-border\)/);
  assert.match(theme, /\.choice\s*\{[^}]*box-shadow:\s*var\(--neo-shadow\)/);
  assert.match(theme, /\.choice:active:not\(:disabled\)\s*\{\s*transform:\s*translate\(2px,\s*2px\);/);
});

test('theme.css styles celebration screen in dark indigo with orange CTA', () => {
  assert.match(theme, /#summary,\s*#classDone,\s*\.neo-celebration\s*\{[^}]*background:\s*var\(--neo-indigo\)/);
  assert.match(theme, /#summary,\s*#classDone,\s*\.neo-celebration\s*\{[^}]*color:\s*var\(--card\)/);
  assert.match(theme, /#summary\s*\.primary,\s*#classDone\s*\.primary\s*\{[^}]*background:\s*var\(--neo-orange\)/);
});

test('theme.css zero-literal rule remains strictly observed', () => {
  const CSS_COLOR = /(?:[:,?=]|\|\||\b(?:solid|dashed|dotted|px)\s)\s*["'`]?(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g;
  const lits = Array.from(theme.matchAll(CSS_COLOR), (m) => m[1]);
  assert.deepEqual(lits, [], 'theme.css must contain zero color literals');
});
