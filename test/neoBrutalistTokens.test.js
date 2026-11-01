// Neo-brutalist design system tests for kids (#891 / redesign)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const sefirot = fs.readFileSync(path.join(root, 'src/sefirot.css'), 'utf8');
const theme = fs.readFileSync(path.join(root, 'src/theme.css'), 'utf8');

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const channel = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const [r, g, b] = rgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const tokenVal = (css, name) => {
  const m = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\b`));
  assert.ok(m, `${name} must exist with a 6-digit hex code`);
  return m[1].toLowerCase();
};

test('neo-brutalist palette tokens exist in sefirot.css', () => {
  const tokens = [
    '--neo-outline',
    '--neo-cream',
    '--neo-lavender',
    '--neo-yellow',
    '--neo-orange',
    '--neo-turquoise',
    '--neo-sky',
    '--neo-purple',
    '--neo-indigo',
  ];
  for (const t of tokens) {
    const hex = tokenVal(sefirot, t);
    assert.match(hex, /^#[0-9a-f]{6}$/, `${t} must be valid hex`);
  }
});

test('neo-brutalist text and button contrasts meet or exceed WCAG AA 4.5:1', () => {
  const outline = tokenVal(sefirot, '--neo-outline');
  const cream = tokenVal(sefirot, '--neo-cream');
  const lavender = tokenVal(sefirot, '--neo-lavender');
  const yellow = tokenVal(sefirot, '--neo-yellow');
  const orange = tokenVal(sefirot, '--neo-orange');
  const turquoise = tokenVal(sefirot, '--neo-turquoise');
  const sky = tokenVal(sefirot, '--neo-sky');
  const purple = tokenVal(sefirot, '--neo-purple');
  const indigo = tokenVal(sefirot, '--neo-indigo');
  const white = '#ffffff';

  const pairs = [
    ['thick blue outline on cream', outline, cream],
    ['thick blue outline on lavender', outline, lavender],
    ['thick blue outline on yellow', outline, yellow],
    ['orange button text on white', white, orange],
    ['turquoise button text on white', white, turquoise],
    ['sky button text on white', white, sky],
    ['purple button text on white', white, purple],
    ['celebration text on dark indigo', white, indigo],
    ['orange text on cream background', orange, cream],
    ['turquoise text on cream background', turquoise, cream],
  ];

  for (const [desc, fg, bg] of pairs) {
    const ratio = contrast(fg, bg);
    assert.ok(ratio >= 4.5, `${desc} (${ratio.toFixed(2)}:1) must be >= 4.5:1`);
  }
});

test('theme.css defines neo-brutalist shared variables', () => {
  const vars = [
    '--font-heading',
    '--neo-border',
    '--neo-shadow',
    '--neo-shadow-lg',
    '--neo-shadow-press',
    '--neo-radius',
    '--neo-btn-min-h',
  ];
  for (const v of vars) {
    assert.ok(theme.includes(v), `theme.css must declare ${v}`);
  }
});

test('theme.css defines layout and component classes', () => {
  const classes = [
    '.neo-box',
    '.neo-card',
    '.neo-btn',
    '.neo-header',
    '.neo-header-stars',
    '.neo-play-area',
    '.neo-action-bar',
    '.neo-celebration',
  ];
  for (const c of classes) {
    assert.ok(theme.includes(c), `theme.css must define ${c}`);
  }
});

test('theme.css contains zero color literals and respects reduced motion', () => {
  const CSS_COLOR = /(?:[:,?=]|\|\||\b(?:solid|dashed|dotted|px)\s)\s*["'`]?(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g;
  const lits = Array.from(theme.matchAll(CSS_COLOR), (m) => m[1]);
  assert.deepEqual(lits, [], 'theme.css must contain no color literals');
  assert.match(theme, /\.neo-btn:active:not\(:disabled\)[^{]*\{\s*transform:\s*none;/);
});
