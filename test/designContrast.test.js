// #423 — every colour pair docs/DESIGN.md promises is measured here, from the
// values in src/sefirot.css, with the WCAG 2.2 relative-luminance formula.
// Text needs 4.5:1 (1.4.3); a focus ring or a bar edge needs 3:1 (1.4.11).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'src/sefirot.css'), 'utf8');
const design = fs.readFileSync(path.join(root, 'docs/DESIGN.md'), 'utf8');

const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\b`));
  assert.ok(m, `--${name} needs a six-digit value in src/sefirot.css`);
  return m[1].toLowerCase();
};
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const channel = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const [r, g, b] = rgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// color-mix(in srgb, a p%, b), the way theme.css tints a surface.
const mix = (a, p, b) => '#' + rgb(a).map((v, i) =>
  Math.round(v * p + rgb(b)[i] * (1 - p)).toString(16).padStart(2, '0')).join('');

// [foreground, background, minimum, where it shows up]
const TEXT = 4.5;
const EDGE = 3;
const pairs = () => {
  const t = Object.fromEntries(['ink', 'muted', 'confidence', 'focus', 'joy', 'yellow',
    'bg', 'card', 'good', 'bad'].map((n) => [n, token(n)]));
  return [
    [t.ink, t.bg, TEXT, 'ink on bg'],
    [t.ink, t.card, TEXT, 'ink on card'],
    [t.muted, t.card, TEXT, 'muted on card'],
    [t.muted, t.bg, TEXT, 'muted on bg'],
    [t.confidence, t.card, TEXT, 'link on card'],
    [t.card, t.confidence, TEXT, 'button text on confidence'],
    [t.confidence, mix(t.confidence, 0.09, t.card), TEXT, 'confidence on accent-soft'],
    [t.focus, t.card, TEXT, 'focus kicker on card'],
    [t.card, t.focus, TEXT, 'button text on focus (lessons)'],
    [t.good, t.card, TEXT, 'good on card'],
    [t.card, t.good, TEXT, 'button text on good'],
    [t.good, mix(t.good, 0.12, t.card), TEXT, 'good on its tint'],
    [t.bad, t.card, TEXT, 'bad on card'],
    [t.bad, mix(t.bad, 0.12, t.card), TEXT, 'bad on its tint'],
    [t.ink, t.joy, TEXT, 'ink on joy'],
    [t.ink, t.yellow, TEXT, 'ink on yellow bar'],
    [t.focus, t.card, EDGE, 'focus ring against card gap'],
    [t.confidence, mix(t.confidence, 0.10, t.card), EDGE, 'progress fill against track'],
  ];
};

test('every promised colour pair passes WCAG 2.2 AA', () => {
  for (const [fg, bg, min, where] of pairs()) {
    const r = ratio(fg, bg);
    assert.ok(r >= min, `${where}: ${fg} on ${bg} is ${r.toFixed(2)}:1, needs ${min}:1`);
  }
});

test('the ratio formula matches the WCAG reference points', () => {
  assert.equal(ratio('#000000', '#ffffff').toFixed(2), '21.00');
  assert.equal(ratio('#777777', '#ffffff').toFixed(2), '4.48');
});

test('the yellows stay off text: on white they fail even the 3:1 edge rule', () => {
  // That is why DESIGN.md says they fill, and ink sits on them.
  assert.ok(ratio(token('joy'), token('card')) < EDGE);
  assert.ok(ratio(token('yellow'), token('card')) < EDGE);
});

test('DESIGN.md quotes the palette values sefirot.css actually ships', () => {
  for (const name of ['confidence', 'focus', 'joy', 'good', 'bad', 'bg', 'ink', 'card']) {
    assert.ok(design.toLowerCase().includes(token(name)), `DESIGN.md should show --${name} ${token(name)}`);
  }
});

test('DESIGN.md frames the palette as inspiration, not a claim', () => {
  assert.match(design, /בהשראת סמליות צבעים מסורתית/);
  assert.match(design, /3 בחירות/);
});
