// #421 — docs/DESIGN.md is the spec; src/sefirot.css is the implementation.
// Nothing stops the two from drifting except this file: before it existed the
// doc claimed the weekly bar was filled with Tiferet gold while the CSS filled
// it with Chesed blue, and the gold it named failed 3:1 on its own track.
//
// So: every hex in the doc's palette table must be the hex in the CSS, in both
// modes, and every pair the doc publishes a ratio for is re-measured here.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const css = read('src/sefirot.css');
const design = read('docs/DESIGN.md');

// --- contrast maths (sRGB, WCAG 2.x) ----------------------------------------
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));
const chan = (c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : (((c / 255) + 0.055) / 1.055) ** 2.4);
const lum = (c) => 0.2126 * chan(c[0]) + 0.7152 * chan(c[1]) + 0.0722 * chan(c[2]);
const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const mix = (a, b, pct) => a.map((v, i) => Math.round((v * pct + b[i] * (100 - pct)) / 100));

// --- the two token blocks ---------------------------------------------------
const atMedia = css.indexOf('@media (prefers-color-scheme: dark)');
assert.notEqual(atMedia, -1, 'sefirot.css must carry a dark block');

function tokensIn(block) {
  const out = {};
  for (const [, name, hex] of block.matchAll(/(--[a-z-]+):\s*(#[0-9a-fA-F]{6})\b/g)) out[name] = hex;
  return out;
}

const LIGHT = tokensIn(css.slice(css.indexOf(':root {'), atMedia));
// The dark block overrides only colors, so fall back to light for the rest.
const DARK = { ...LIGHT, ...tokensIn(css.slice(atMedia, css.indexOf('}\n}', atMedia))) };

const ROLES = ['--bg', '--card', '--ink', '--confidence', '--focus', '--joy', '--good', '--bad'];
const NEUTRALS = ['--muted', '--line', '--line-strong'];

test('the palette is 8 role colors plus 3 neutrals, all defined in both modes', () => {
  for (const name of [...ROLES, ...NEUTRALS]) {
    assert.match(LIGHT[name] || '', /^#[0-9a-f]{6}$/, `${name} missing from the light block`);
    assert.match(DARK[name] || '', /^#[0-9a-f]{6}$/, `${name} missing from the dark block`);
    assert.notEqual(DARK[name], LIGHT[name], `${name} must be lifted for dark, not reused`);
  }
});

test('every role color is a distinct hue, so no two roles look the same', () => {
  // The old palette used #7a2e3a for both «this is the topic» and «you were
  // wrong». Two roles sharing a hex is the bug, not a saving.
  for (const mode of [LIGHT, DARK]) {
    const seen = new Map();
    for (const name of ROLES) {
      assert.ok(!seen.has(mode[name]), `${name} and ${seen.get(mode[name])} share ${mode[name]}`);
      seen.set(mode[name], name);
    }
  }
});

test('the aliases really equal the roles they claim to alias', () => {
  for (const [alias, role] of [['--purple', '--confidence'], ['--pink', '--focus'],
    ['--yellow', '--joy'], ['--ring', '--focus']]) {
    assert.equal(LIGHT[alias], LIGHT[role], `${alias} should be ${role} in light`);
    assert.equal(DARK[alias], DARK[role], `${alias} should be ${role} in dark`);
  }
});

test('docs/DESIGN.md publishes the same hexes the CSS defines', () => {
  // The doc's tables carry `--token` ... `#hex` on one row; whatever hex a row
  // names for a token must be a hex that token actually has.
  let checked = 0;
  for (const line of design.split('\n')) {
    if (!line.startsWith('|')) continue;
    const token = line.match(/`(--[a-z-]+)`/);
    const hexes = line.match(/`(#[0-9a-fA-F]{6})`/g);
    if (!token || !hexes) continue;
    const name = token[1];
    if (!(name in LIGHT)) continue;
    for (const raw of hexes) {
      const hex = raw.slice(1, -1).toLowerCase();
      assert.ok([LIGHT[name], DARK[name]].includes(hex),
        `docs/DESIGN.md says ${name} is ${hex}, but the CSS has ` +
        `${LIGHT[name]} (light) / ${DARK[name]} (dark)`);
      checked += 1;
    }
  }
  assert.ok(checked >= 20, `only ${checked} doc hexes cross-checked — did the tables move?`);
});

// --- the contrast contract, re-measured in both modes -----------------------
// Text needs 4.5:1 (AA), a non-text element needs 3:1 (SC 1.4.11).
// Track and feedback fills are the color-mix values the CSS actually uses.
function pairs(t, trackPct) {
  const c = (name) => rgb(t[name]);
  const track = mix(c('--confidence'), c('--card'), trackPct);
  return [
    ['--ink on --card', c('--ink'), c('--card'), 4.5],
    ['--ink on --bg', c('--ink'), c('--bg'), 4.5],
    ['--muted on --card', c('--muted'), c('--card'), 4.5],
    ['--muted on --bg', c('--muted'), c('--bg'), 4.5],
    ['--confidence link on --card', c('--confidence'), c('--card'), 4.5],
    ['--confidence link on --bg', c('--confidence'), c('--bg'), 4.5],
    ['--focus kicker on --card', c('--focus'), c('--card'), 4.5],
    ['--focus kicker on --bg', c('--focus'), c('--bg'), 4.5],
    ['--good on its 12% fill', c('--good'), mix(c('--good'), c('--card'), 12), 4.5],
    ['--bad on its 12% fill', c('--bad'), mix(c('--bad'), c('--card'), 12), 4.5],
    ['--card label on a --confidence button', c('--card'), c('--confidence'), 4.5],
    ['--ink on the track', c('--ink'), track, 4.5],
    ['--muted on the track', c('--muted'), track, 4.5],
    ['--confidence bar fill vs the track', c('--confidence'), track, 3],
    ['--joy mark vs --card', c('--joy'), c('--card'), 3],
    ['--joy mark vs --bg', c('--joy'), c('--bg'), 3],
    ['--joy mark vs the track', c('--joy'), track, 3],
    ['--ring vs --card', c('--ring'), c('--card'), 3],
    ['--ring vs --bg', c('--ring'), c('--bg'), 3],
    ['--line-strong vs --card', c('--line-strong'), c('--card'), 3],
    ['--line-strong vs --bg', c('--line-strong'), c('--bg'), 3],
  ];
}

for (const [mode, t, pct] of [['light', LIGHT, 10], ['dark', DARK, 10]]) {
  test(`${mode}: every documented pair clears its WCAG floor`, () => {
    for (const [label, fg, bg, floor] of pairs(t, pct)) {
      const ratio = contrast(fg, bg);
      assert.ok(ratio >= floor,
        `${mode} ${label}: ${ratio.toFixed(2)}:1 is under ${floor}:1`);
    }
  });
}

test('--joy is never used as a text color anywhere', () => {
  // It only clears 3:1, not 4.5:1 — docs/DESIGN.md promises «not text».
  assert.ok(contrast(rgb(LIGHT['--joy']), rgb(LIGHT['--card'])) < 4.5,
    'if --joy now clears 4.5:1, relax this rule in docs/DESIGN.md deliberately');
  for (const m of css.matchAll(/color:\s*var\(--(joy|yellow)\)/g)) {
    assert.fail(`sefirot.css paints text with ${m[0]}; --joy is a mark, not a color for type`);
  }
});

// --- the rest of the spec: type, spacing, motion, ring ----------------------
test('the Hebrew font stack is local-first, with no third-party request', () => {
  const font = css.match(/--font:\s*([^;]+);/);
  assert.ok(font, '--font must be a token');
  for (const family of ['Assistant', 'Rubik', 'Heebo']) {
    assert.ok(font[1].includes(family), `--font should offer ${family}`);
  }
  assert.ok(font[1].includes('system-ui'), '--font needs a system fallback');
  assert.ok(!/@import|fonts\.googleapis|fonts\.gstatic/.test(css),
    'no webfont fetch: the app is an offline PWA (sw.js)');
  assert.match(css, /body\s*{[^}]*font-family:\s*var\(--font\)/,
    'the token has to actually reach <body>');
});

test('the spacing scale is a 4px base with no gaps', () => {
  const want = [4, 8, 12, 16, 24, 32, 48];
  want.forEach((px, i) => {
    assert.match(css, new RegExp(`--sp-${i + 1}:\\s*${px}px`), `--sp-${i + 1} should be ${px}px`);
  });
  for (const r of ['--r-sm', '--r-md', '--r-lg', '--r-pill']) {
    assert.match(css, new RegExp(`${r}:\\s*\\d+px`), `${r} needs a value`);
  }
});

test('motion is short and folds to zero under prefers-reduced-motion', () => {
  assert.match(css, /--motion-fast:\s*120ms/);
  assert.match(css, /--motion:\s*200ms/);
  assert.match(css, /--motion-ease:\s*cubic-bezier/);
  const reduce = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduce, /--motion-fast:\s*0ms/, 'reduced motion must zero --motion-fast');
  assert.match(reduce, /--motion:\s*0ms/, 'reduced motion must zero --motion');
  assert.ok(!/transition:[^;]*\b(0?\.\d+|\d+)s\b/.test(css),
    'transitions should be timed by var(--motion), not a literal duration');
});

test('the focus ring is one rule, 3px at 2px offset, painted from --ring', () => {
  const at = css.indexOf(':focus-visible');
  assert.notEqual(at, -1, 'sefirot.css owns the ring');
  const rule = css.slice(at, css.indexOf('}', at));
  assert.match(rule, /outline:\s*3px solid var\(--ring\)/);
  assert.match(rule, /outline-offset:\s*2px/);
  // The 2px gap is what makes the ring legal on a filled primary button: the
  // gap shows the parent surface, so the ring is measured against paper.
  for (const mode of [LIGHT, DARK]) {
    for (const surface of ['--card', '--bg']) {
      assert.ok(contrast(rgb(mode['--ring']), rgb(mode[surface])) >= 3,
        `the ring must clear 3:1 against ${surface}`);
    }
  }
});

test('no gradient survives: flat fills only', () => {
  assert.ok(!/linear-gradient|radial-gradient/.test(css),
    'docs/DESIGN.md says no gradient');
  assert.match(css, /\.progress span\s*{[^}]*background:\s*var\(--confidence\)/,
    'the session bar is the same flat blue as the weekly bar');
});

test('controls get --line-strong, not the decorative --line', () => {
  assert.match(css, /input,\s*select\s*{[^}]*border-color:\s*var\(--line-strong\)/);
  // --line is deliberately below 3:1; it may only separate two surfaces.
  assert.ok(contrast(rgb(LIGHT['--line']), rgb(LIGHT['--card'])) < 3,
    '--line is the soft hairline; if it got darker, say so in docs/DESIGN.md');
});

test('every page that links the palette gets the dark mode and the font', () => {
  const pages = ['index.html', 'landing.html', 'offer.html', 'curriculum.html',
    'frequency.html', 'functions.html', '807.html', 'check.html'];
  for (const page of pages) {
    assert.ok(read(page).includes('src/sefirot.css'), `${page} must link src/sefirot.css`);
  }
  assert.ok(read('sw.js').includes('./src/sefirot.css'), 'the palette must be precached');
});
