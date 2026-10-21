// #427 — the server-side checks for the demo design (#423, #424), the pace
// meter (#425) and the first screen (#426). Everything here runs in npm test
// with no install; the browser half (axe, real 44px boxes, 360/1366 screens)
// is e2e/design.spec.js, run by hand.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pace = require('../src/lib/pace');
const { buildLearnerPlan } = require('../src/lib/learnerPlan');
const { struggleTopicsFor } = require('../src/lib/struggleTopics');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const sefirot = read('src/sefirot.css');
const theme = read('src/theme.css');
const indexHtml = read('index.html');

// --- 1. WCAG AA for every token pair -----------------------------------------
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));
const chan = (c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : (((c / 255) + 0.055) / 1.055) ** 2.4);
const lum = (c) => 0.2126 * chan(c[0]) + 0.7152 * chan(c[1]) + 0.0722 * chan(c[2]);
const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const mix = (a, b, pct) => a.map((v, i) => Math.round((v * pct + b[i] * (100 - pct)) / 100));

const tokens = {};
for (const [, name, hex] of sefirot.matchAll(/(--[a-z]+):\s*(#[0-9a-fA-F]{6})/g)) tokens[name] = rgb(hex);

// Tokens that may paint text, and tokens that are fills or hairlines only.
const TEXT = ['--ink', '--muted', '--purple', '--pink', '--good', '--bad', '--focus', '--confidence'];
const FILL = ['--yellow', '--joy', '--sky', '--mint', '--bg', '--card', '--line'];

test('every token in sefirot.css is classed as text or fill', () => {
  assert.deepEqual(Object.keys(tokens).sort(), TEXT.concat(FILL).sort(),
    'a new token needs a role here, and a contrast check if it can be text');
});

test('every text token is AA (4.5:1) on every surface the theme paints', () => {
  const t = tokens;
  const surfaces = {
    '--bg': t['--bg'],
    '--card': t['--card'],
    '--accent-soft (violet)': mix(t['--confidence'], t['--card'], 9),
    '--accent-soft (#lessons raspberry)': mix(t['--focus'], t['--card'], 9),
    '--surface-2': mix(t['--ink'], t['--card'], 3),
  };
  const fails = [];
  for (const fg of TEXT) {
    for (const [name, bg] of Object.entries(surfaces)) {
      const ratio = contrast(t[fg], bg);
      if (ratio < 4.5) fails.push(`${fg} on ${name}: ${ratio.toFixed(2)}:1`);
    }
  }
  // White labels sit on the solid action and status fills.
  for (const fill of ['--purple', '--pink', '--good', '--bad', '--focus', '--confidence']) {
    const ratio = contrast(t['--card'], t[fill]);
    if (ratio < 4.5) fails.push(`--card label on ${fill}: ${ratio.toFixed(2)}:1`);
  }
  assert.deepEqual(fails, []);
});

test('fill-only tokens never become a text color', () => {
  const fillVar = /var\(--(?:yellow|joy|sky|mint|line|bg)\)/;
  const sources = { 'src/sefirot.css': sefirot, 'src/theme.css': theme, 'index.html': indexHtml };
  for (const [rel, text] of Object.entries(sources)) {
    for (const m of text.matchAll(/(?:^|[;{\s"'])color:\s*([^;}"']+)/g)) {
      assert.doesNotMatch(m[1], fillVar, `${rel}: «color: ${m[1].trim()}» is under AA on paper`);
    }
  }
});

// --- 2. 44px touch targets ----------------------------------------------------
test('every control gets a 44px floor and nothing styles it smaller', () => {
  assert.match(indexHtml, /button,select,input:not\(\[type=checkbox\]\):not\(\[type=radio\]\),summary,\.level,\.navcard\{min-height:44px\}/);
  for (const [rel, css] of [['src/theme.css', theme], ['src/sefirot.css', sefirot]]) {
    for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const sel = m[1].trim();
      if (!/\b(button|select|input|summary)\b|\.(tab|primary|secondary|level|choice|navcard)\b/.test(sel)) continue;
      for (const h of m[2].matchAll(/(?:^|;)\s*(?:min-)?height:\s*(\d+)px/g)) {
        assert.ok(Number(h[1]) >= 44, `${rel} «${sel}» sets a ${h[1]}px control`);
      }
    }
  }
});

// --- 3. First screen: at most three choices, RTL ------------------------------
test('first screen offers at most three reinforcement choices per grade, in Hebrew RTL', () => {
  assert.match(indexHtml, /<html[^>]*lang="he"[^>]*dir="rtl"|<html[^>]*dir="rtl"[^>]*lang="he"/);
  assert.match(indexHtml, /struggleTopicsFor\(selectedGrade\):\[\];\s*list\.slice\(0,3\)/,
    'renderStruggleButtons must cap the list at three');
  for (const g of ['א', 'ב', 'ג', 'ד', 'ה', 'ו']) {
    const rows = struggleTopicsFor(g);
    assert.ok(rows.length <= 3, `grade ${g} lists ${rows.length} topics; three are shown, the rest hide`);
    rows.forEach((r) => assert.match(r.he, /[֐-׿]/, `grade ${g} topic needs a Hebrew label`));
  }
});

// --- 4. Pace meter: three states for a weak, a medium and a strong student ----
const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_760_000_000_000;

// Same roster shape the teacher report reads: sessions with answered items.
function student(name, sessionCount, correct, total) {
  const sessions = [];
  for (let i = 0; i < sessionCount; i++) {
    const items = [];
    for (let k = 0; k < total; k++) items.push({ skill: 'מנייה', correct: k < correct, prompt: 'q', answer: 1, given: 1 });
    sessions.push({ id: 's' + i, kind: 'diag', started: NOW - 14 * DAY + i * DAY, items: items });
  }
  return { name: name, created: 1, assignments: [], sessions: sessions };
}

// index.html paceMeterHtml(): plan picks the topic, pace measures the sessions.
function meter(kid) {
  const plan = buildLearnerPlan({ grade: 'א', student: kid, name: kid.name, now: NOW });
  assert.ok(plan.ok, kid.name + ': ' + plan.error);
  const progress = pace.paceProgress({ topic: plan.topic, student: kid, now: NOW });
  return { progress, html: pace.renderPaceMeterHtml(progress) };
}

const CASES = [
  // two weeks in, the typical pace is six sessions
  { who: 'חלש', kid: student('נועה', 2, 1, 5), status: 'behind', word: 'צריך חיזוק' },
  { who: 'בינוני', kid: student('איתי', 6, 3, 5), status: 'on', word: 'בקצב' },
  { who: 'חזק', kid: student('מאיה', 9, 5, 5), status: 'ahead', word: 'מקדים' },
];

for (const c of CASES) {
  test(`pace meter for a ${c.who} student reads «${c.word}»`, () => {
    const { progress, html } = meter(c.kid);
    assert.equal(progress.status, c.status);
    assert.match(html, new RegExp(`data-status="${c.status}"`));
    assert.match(html, new RegExp(`<p class="mm-pace-status"><b>${c.word}</b>`));
    assert.match(html, /dir="rtl"/);
    assert.match(html, /role="progressbar"[^>]*aria-valuetext="[^"]+"/);
    assert.match(html, /טווח טיפוסי ולא הבטחה/);
    // The status names the topic's pace, never the child.
    assert.doesNotMatch(html, /חלש|מתקשה|לקוי|מצטיין/);
  });
}

test('each pace state has its own accent, and its status word is AA on the card', () => {
  const word = { on: '--confidence', ahead: '--good', behind: '--focus' };
  assert.match(sefirot, /\.mm-pace-status b \{ color: var\(--confidence\); \}/);
  for (const s of ['ahead', 'behind']) {
    assert.match(sefirot, new RegExp(`\\.mm-pace\\[data-status="${s}"\\] \\{ border-inline-start-color: var\\(--`));
    assert.match(sefirot, new RegExp(`\\.mm-pace\\[data-status="${s}"\\] \\.mm-pace-status b \\{ color: var\\(${word[s]}\\); \\}`));
  }
  for (const [s, tok] of Object.entries(word)) {
    const ratio = contrast(tokens[tok], tokens['--card']);
    assert.ok(ratio >= 4.5, `«${s}» word ${tok}: ${ratio.toFixed(2)}:1`);
  }
});
