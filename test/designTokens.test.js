// #424 — the new surfaces must paint from the sefirot tokens, not from literals.
// src/sefirot.css is the only place allowed to name a color; everything else
// says var(--card) / var(--good) / var(--bad) / var(--confidence).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

// A color literal in a CSS *value* position: after «:», «,», a ternary «?»,
// «||», «=» or a border keyword. «issue #102» ו-«(#110)» are issue references,
// not colors, and are deliberately outside this shape.
const CSS_COLOR = /(?:[:,?=]|\|\||\b(?:solid|dashed|dotted|px)\s)\s*["'`]?(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g;

const literals = (text) => Array.from(text.matchAll(CSS_COLOR), (m) => m[1]);

const indexHtml = read('index.html');
const styleBlock = indexHtml.slice(indexHtml.indexOf('<style>'), indexHtml.indexOf('</style>'));
const indexBody = indexHtml.slice(indexHtml.indexOf('</style>'));

function ruleFor(css, selector) {
  const at = css.indexOf(selector);
  assert.notEqual(at, -1, `${selector} should still exist`);
  const rest = css.slice(at);
  return rest.slice(0, rest.indexOf('}'));
}

test('the color-literal detector tells colors from issue references apart', () => {
  assert.deepEqual(literals('background:#fff8e1;border:1px dashed #999'), ['#fff8e1', '#999']);
  assert.deepEqual(literals("color:${odd ? '#e65100' : 'var(--ink)'}"), ['#e65100']);
  assert.deepEqual(literals('// widgets (slice 2 of #102 / #328), issue #110'), []);
});

test('learner-plan and music view builders name no colors at all', () => {
  // They render classes; the palette lives in src/sefirot.css. Keep it that way.
  for (const rel of [
    'src/lib/learnerPlan.js',
    'src/lib/learnerPlanView.js',
    'src/lib/grade1Music.js',
    'src/lib/grade2Music.js',
    'src/lib/grade3Music.js',
  ]) {
    assert.deepEqual(literals(read(rel)), [], `${rel} should carry no color literals`);
  }
});

test('index.html quiz-choice feedback paints from --good / --bad', () => {
  for (const gone of ['#e5f6ef', '#167957', '#fde8ea', '#c5221f', 'rgb(253,232,234)']) {
    assert.ok(!indexBody.includes(gone), `${gone} should be a token now`);
  }
  assert.ok(indexBody.includes('color-mix(in srgb, var(--good) 12%, var(--card))'));
  assert.ok(indexBody.includes('color-mix(in srgb, var(--bad) 12%, var(--card))'));
  assert.ok(indexBody.includes("b.style.color = 'var(--good)'"));
  assert.ok(indexBody.includes("b.style.color = 'var(--bad)'"));
});

test('index.html card surfaces use --card, never a white literal', () => {
  assert.deepEqual(indexBody.match(/#fff(?![0-9a-fA-F])|#ffffff\b/g) || [], [],
    'lesson-step cards and on-brand labels should say var(--card)');
  assert.ok(indexBody.includes('background:var(--card);border:1px solid var(--line)'));
});

test('empty progress / beat / grid tracks tint --confidence', () => {
  const tint = 'color-mix(in srgb, var(--confidence) 10%, var(--card))';
  assert.ok(!styleBlock.includes('#ece7f5'), 'track slots should be token-tinted');
  for (const sel of ['.progress{', '.beat-window{', '.g3-cell{']) {
    assert.ok(ruleFor(styleBlock, sel).includes(tint), `${sel} should tint --confidence`);
  }
  const sefirot = read('src/sefirot.css');
  assert.ok(ruleFor(sefirot, '.mm-plan-track {').includes(tint), 'learner-plan track should tint too');
  assert.ok(ruleFor(sefirot, '.mm-plan-track > span {').includes('background: var(--confidence)'),
    'the week bar fill is the confidence blue');
  assert.ok(ruleFor(sefirot, '.mm-plan-why {').includes('color: var(--muted)'),
    'the «why» line (#425) is muted, not colored');
});

test('sefirot.css is the single source of the palette', () => {
  const sefirot = read('src/sefirot.css');
  for (const token of ['--ink', '--muted', '--purple', '--pink', '--yellow', '--bg', '--card',
    '--line', '--good', '--bad', '--focus', '--joy', '--confidence']) {
    assert.match(sefirot, new RegExp(`${token}:\\s*#[0-9a-fA-F]{3,8}`), `${token} needs a value`);
  }
  assert.ok(indexHtml.includes('src/sefirot.css'), 'index.html must link the palette');
});

// --- WCAG AA for the mixes this PR introduces (#424 acceptance) ---------------
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));
const chan = (c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : (((c / 255) + 0.055) / 1.055) ** 2.4);
const lum = (c) => 0.2126 * chan(c[0]) + 0.7152 * chan(c[1]) + 0.0722 * chan(c[2]);
const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
// color-mix(in srgb, a pct%, b)
const mix = (a, b, pct) => a.map((v, i) => Math.round((v * pct + b[i] * (100 - pct)) / 100));

// Scoped to the light «:root» block on purpose. src/sefirot.css also carries a
// dark block (#421), and reading the whole file would let the last hex win —
// these cases would then silently measure dark. Dark is checked in
// test/designSpec.test.js against the same floors.
function palette() {
  const css = read('src/sefirot.css');
  const light = css.slice(css.indexOf(':root {'), css.indexOf('@media'));
  const out = {};
  for (const [, name, hex] of light.matchAll(/(--[a-z]+):\s*(#[0-9a-fA-F]{6})/g)) {
    out[name] = rgb(hex);
  }
  return out;
}

test('token mixes keep text at 4.5:1 or better', () => {
  const t = palette();
  const cases = [
    ['--good on the correct-answer fill', t['--good'], mix(t['--good'], t['--card'], 12)],
    ['--bad on the wrong-answer fill', t['--bad'], mix(t['--bad'], t['--card'], 12)],
    ['--ink on a tinted track', t['--ink'], mix(t['--confidence'], t['--card'], 10)],
    ['--muted on a tinted track', t['--muted'], mix(t['--confidence'], t['--card'], 10)],
    ['--card label on a --purple button', t['--card'], t['--purple']],
    ['--ink on --card', t['--ink'], t['--card']],
    ['--muted on --card', t['--muted'], t['--card']],
  ];
  for (const [name, fg, bg] of cases) {
    const ratio = contrast(fg, bg);
    assert.ok(ratio >= 4.5, `${name}: ${ratio.toFixed(2)}:1 is under 4.5:1`);
  }
});

// Ratchet: the rest of index.html is still on the old candy palette (purples,
// greens and oranges inside inline styles). Later PRs of #424 bring it down;
// this number may only ever shrink.
const REMAINING_LITERAL_BUDGET = 133;

test('no new hard-coded colors creep into index.html', () => {
  const found = literals(indexBody);
  assert.ok(found.length <= REMAINING_LITERAL_BUDGET,
    `index.html has ${found.length} color literals outside <style>, budget is ` +
    `${REMAINING_LITERAL_BUDGET}. Use a token from src/sefirot.css instead.`);
  assert.ok(found.length >= REMAINING_LITERAL_BUDGET - 10,
    `only ${found.length} literals left — lower REMAINING_LITERAL_BUDGET to ${found.length}`);
});
