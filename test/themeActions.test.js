// #504 — design only: button colours follow the action we want, the phone tab
// row scrolls instead of stacking, and reduced motion reaches the decorative
// notes. These read the stylesheet; no JS, ID or flow is involved.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const theme = fs.readFileSync(path.join(__dirname, '..', 'src', 'theme.css'), 'utf8');
const block = (selector) => {
  const at = theme.indexOf(selector);
  assert.notEqual(at, -1, `${selector} should exist in theme.css`);
  return theme.slice(at, theme.indexOf('}', at));
};

test('«next» after a correct answer goes green, stepping back stays quiet', () => {
  assert.match(block('.feedback.good:not(.hidden) ~ .primary:not(.hidden) {'), /background: var\(--good\)/);
  assert.match(block('\n.secondary {'), /color: var\(--ink\)/);
  assert.match(block('.secondary[aria-pressed="true"] {'), /color: var\(--confidence\)/);
});

test('keyboard focus is marked with the --focus colour', () => {
  assert.match(block('summary:focus-visible {'), /outline-color: var\(--focus\)/);
});

test('phone tab row is one scrolling line', () => {
  const phone = theme.slice(theme.indexOf('@media (max-width: 680px)'));
  assert.match(phone, /\.tabs \{[^}]*flex-wrap: nowrap[^}]*overflow-x: auto/);
  assert.match(phone, /\.tab \{ flex: none;/);
});

test('#507: no floating notes; reduced motion stops the sheen and the answer pop', () => {
  assert.doesNotMatch(theme, /body::(before|after)/);
  const calm = theme.slice(theme.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(calm, /\.progress span::after \{ animation: none;/);
  assert.match(calm, /\.feedback\.good, \.feedback\.bad, \.choice\.picked-good, \.choice\.picked-bad \{ animation: none; \}/);
});
