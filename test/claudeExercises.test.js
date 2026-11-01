// Special Ed accessibility and Claude-style exercise design verification
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const theme = fs.readFileSync(path.join(root, 'src', 'theme.css'), 'utf8');
const sefirot = fs.readFileSync(path.join(root, 'src', 'sefirot.css'), 'utf8');

test('theme.css applies warm calm serif styling to prompts', () => {
  assert.match(theme, /\.prompt\s*\{[^}]*font-family:\s*var\(--font-heading\)/);
  assert.match(theme, /\.prompt\s*\{[^}]*background:\s*var\(--surface-2\)/);
  assert.match(theme, /\.prompt\s*\{[^}]*border:\s*1px solid var\(--line\)/);
});

test('feedback cards use gentle green and soft terracotta tints without harsh colors', () => {
  assert.match(theme, /\.feedback\.good\s*\{[^}]*background:\s*var\(--good-tint\)/);
  assert.match(theme, /\.feedback\.good\s*\{[^}]*color:\s*var\(--good\)/);
  assert.match(theme, /\.feedback\.bad\s*\{[^}]*background:\s*var\(--bad-tint\)/);
  assert.match(theme, /\.feedback\.bad\s*\{[^}]*color:\s*var\(--bad\)/);
});

test('keyboard focus-visible outline is high contrast 3px solid var(--focus)', () => {
  assert.match(theme, /:focus-visible[^}]*outline:\s*3px solid var\(--focus\)/);
  assert.match(theme, /:focus-visible[^}]*outline-offset:\s*3px/);
});

test('answer row controls and choices maintain kid-friendly touch targets', () => {
  assert.match(theme, /\.answer-row input\s*\{[^}]*min-height:\s*48px/);
  assert.match(theme, /\.choice\s*\{[^}]*min-height:\s*52px/);
});

test('theme.css maintains zero color literals constraint', () => {
  const CSS_COLOR = /(?:[:,?=]|\|\||\b(?:solid|dashed|dotted|px)\s)\s*["'`]?(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g;
  const lits = Array.from(theme.matchAll(CSS_COLOR), (m) => m[1]);
  assert.deepEqual(lits, [], 'theme.css must contain zero color literals');
});
