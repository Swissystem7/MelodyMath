// Issue #101 / plan §4: the mobile pass. The pure 44px/8px rule is tested
// here; the layout rules themselves are read out of index.html, so an edit
// that drops them fails a test instead of only a phone.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const {
  TARGET_MIN_PX, TARGET_GAP_PX, targetTooSmall, targetGap, touchTargetIssues,
} = require('../src/lib/access.js');

const box = (x, y, w, h, label) => ({ x, y, width: w, height: h, label });

test('a target under 44px on either axis is too small, with half a pixel of slack', () => {
  assert.equal(TARGET_MIN_PX, 44);
  assert.equal(targetTooSmall(box(0, 0, 44, 44)), false);
  assert.equal(targetTooSmall(box(0, 0, 43.8, 44)), false, '43.8px is the browser rounding 44');
  assert.equal(targetTooSmall(box(0, 0, 43, 44)), true, 'too narrow');
  assert.equal(targetTooSmall(box(0, 0, 44, 40)), true, 'too short');
  // A missing or broken box fails the rule rather than passing silently.
  [null, {}, box(0, 0, NaN, 44), box(0, 0, Infinity, 44)].forEach((bad) => {
    assert.equal(targetTooSmall(bad), true, JSON.stringify(bad));
  });
});

test('the gap is measured along the axis the two targets are separated on', () => {
  assert.equal(TARGET_GAP_PX, 8);
  // Side by side with an 8px flex gap, and stacked with 10px between.
  assert.equal(targetGap(box(0, 0, 44, 44), box(52, 0, 44, 44)), 8);
  assert.equal(targetGap(box(0, 0, 44, 44), box(0, 54, 44, 44)), 10);
  // Diagonal grid neighbours: 4px clear on x and 3px on y is 5px of room.
  assert.equal(targetGap(box(0, 0, 44, 44), box(48, 47, 44, 44)), 5);
  // Touching, nesting or overlapping is 0, never a negative distance.
  assert.equal(targetGap(box(0, 0, 44, 44), box(44, 0, 44, 44)), 0);
  assert.equal(targetGap(box(0, 0, 100, 100), box(10, 10, 44, 44)), 0);
});

test('touchTargetIssues names the small and the crowded, and nothing else', () => {
  const small = touchTargetIssues([
    box(0, 0, 44, 44, 'ok'), box(0, 60, 30, 44, 'narrow'), box(0, 130, 44, 20, 'short'),
  ]);
  assert.deepEqual(small.map((i) => [i.label, i.reason]), [['narrow', 'size'], ['short', 'size']]);

  // Two big enough buttons 3px apart: both sides of the pair are reported.
  const crowded = touchTargetIssues([box(0, 0, 44, 44, 'minus'), box(47, 0, 44, 44, 'plus')]);
  assert.deepEqual(crowded.map((i) => [i.label, i.reason, i.other]), [
    ['minus', 'gap', 'plus'], ['plus', 'gap', 'minus'],
  ]);
  // Exactly 8px apart is the spacing the rows already use, so it is allowed.
  assert.deepEqual(touchTargetIssues([box(0, 0, 44, 44, 'a'), box(52, 0, 44, 44, 'b')]), []);
  // A 44px button inside a 60px label is nesting, not a spacing mistake.
  assert.deepEqual(touchTargetIssues([box(0, 0, 120, 60, 'label'), box(8, 8, 44, 44, 'cb')]), []);
});

test('touchTargetIssues takes rubbish and a tighter rule without throwing', () => {
  [null, undefined, []].forEach((bad) => assert.deepEqual(touchTargetIssues(bad), []));
  assert.deepEqual(touchTargetIssues([null]).map((i) => i.reason), ['size']);
  assert.deepEqual(touchTargetIssues([box(0, 0, 44, 44, 'a')], { min: 48 }).map((i) => i.reason), ['size']);
  assert.equal(touchTargetIssues([box(0, 0, 44, 44, 'a'), box(52, 0, 44, 44, 'b')], { gap: 20 }).length, 2);
});

test('index.html pins every finger target at 44px on both axes', () => {
  const html = read('index.html');
  assert.match(html, /button,\.primary,\.secondary,\.tab,\.choice,\.level,summary,label\.secondary\{min-height:44px;min-width:44px\}/);
  assert.match(html, /input,select,textarea\{min-height:44px\}/);
  assert.match(html, /input\[type=range\]\{min-height:44px/);
  // A checkbox inherits `input{width:100%}` and would stretch across its label.
  assert.match(html, /input\[type=checkbox\]\{width:auto/);
  assert.match(html, /\.metro-acc\{display:inline-flex[^}]*min-height:44px\}/);
  assert.match(read('src/lib/print.css'), /#mm-site-nav a\{[^}]*min-height:44px\}/);
});

test('index.html has a phone breakpoint that stacks the rows', () => {
  const html = read('index.html');
  assert.match(html, /@media\(max-width:430px\)/, 'no 360-430px breakpoint');
  const phone = html.slice(html.indexOf('@media(max-width:430px)'));
  assert.match(phone, /\.answer-row\{display:block\}/, 'answer row must stack');
  assert.match(phone, /\.tabs\{display:grid/, 'six tabs must not wrap into slivers');
  assert.match(phone, /\.stat\{flex-basis:100%\}/, 'report stats must stack');
  // `>` matters: the roster, class and grade chips must keep wrapping as chips
  // rather than each taking a full row.
  assert.match(phone, /\.who-bar>button,\.metro-bar>button/);
  // The metronome − and + stay a pair instead of becoming two full rows.
  assert.match(html, /<span class="metro-step">/);
  assert.match(html, /\.metro-step\{display:flex;gap:8px\}/);
});

test('every wide table and widget scrolls in its own box, not with the page', () => {
  const html = read('index.html');
  assert.match(html, /\.table-scroll\{overflow-x:auto/);
  assert.match(html, /#rmWidget,#rmPlanWidget,#classWidget,#beatWidget\{overflow-x:auto/);
  ['classBoard', 'reportSkills', 'reportSessions'].forEach((id) => {
    const at = html.indexOf('id="' + id + '"');
    assert.ok(at > 0, id + ' is gone');
    assert.match(html.slice(Math.max(0, at - 400), at), /class="table-scroll" tabindex="0"/,
      id + ' is not inside a scroll container');
  });
  // Cheap structural check that threading the wrappers in kept the markup sane.
  assert.equal((html.match(/<div\b/g) || []).length, (html.match(/<\/div>/g) || []).length, 'unbalanced <div>');
  assert.equal((html.match(/<table\b/g) || []).length, (html.match(/<\/table>/g) || []).length, 'unbalanced <table>');
  assert.equal((html.match(/class="table-scroll"/g) || []).length, 3);
});

test('both audio tools have a visible play-again button and text when muted', () => {
  const html = read('index.html');
  assert.match(html, /id="freqPlay"[^>]*>השמע שוב</);
  assert.match(html, /id="rhythmPlay"[^>]*>השמע שוב</);
  assert.doesNotMatch(html, /class="replay hidden"/, 'the replay buttons must always be visible');
  // Muted means the value stays on screen as text and nothing plays.
  assert.match(html, /id="freqQuiet"/);
  assert.match(html, /id="rhythmQuiet"/);
  assert.match(html, /if\(play&&!quiet\)playFreq\(hz\)/);
  assert.match(html, /if\(play&&!quiet&&lastRhythm\)playRhythmClicks/);
  // Sound events carry screen-reader text (the access.js pattern), and the
  // numbers they print are isolated LTR so they never mirror (see #93).
  assert.match(html, /id="freq" class="result" role="status" aria-live="polite"/);
  assert.match(html, /id="rhythm" class="result rhythm" role="status" aria-live="polite"/);
  assert.match(html, /<bdi dir="ltr">\$\{hz\.toFixed\(2\)\} Hz<\/bdi>/);
  assert.match(html, /<bdi dir="ltr">\$\{x\.fractionPattern\}<\/bdi>/);
});

test('the audio context is opened by the first pointerdown and not before', () => {
  const core = read('src/lib/core.js');
  assert.match(core, /addEventListener\('pointerdown', unlock, \{ once: true/);
  assert.match(core, /addEventListener\('touchstart', unlock/, 'old WebKit has no pointer events');
  assert.match(core, /installAudioUnlock\(\);/, 'the unlock is never installed');
  // Looked up per event so issue #100's engine can take the global over.
  assert.match(core, /typeof g\.unlockAudio === 'function'/);

  const sonify = require('../src/lib/sonify.js');
  // Inert in Node: no window, so no context and nothing claims to be unlocked.
  assert.equal(sonify.unlockAudio(), null);
  assert.equal(sonify.audioUnlocked(), false);
  // The TODO must keep pointing at the engine issue that is meant to own this.
  assert.match(read('src/lib/sonify.js'), /TODO[\s\S]{0,200}issues\/100/);
});

test('the Playwright spec covers all five device profiles of plan §4.6', () => {
  const spec = read('test/e2e/mobile.spec.js');
  ['820, height: 1180', '390, height: 844', '360, height: 740',
    "devices['iPhone 13']", "devices['Pixel 7']",
    'documentElement.scrollWidth', 'boundingBox()', 'setOffline(true)', 'audioUnlocked()',
  ].forEach((needle) => assert.ok(spec.includes(needle), needle + ' is missing from the spec'));
  // All six home tabs, so a regression cannot hide in an unvisited panel.
  ['remediation', 'practice', 'playground', 'classMode', 'beatMode', 'teacherReport']
    .forEach((t) => assert.ok(spec.includes("'tab-" + t + "'"), 'the spec never opens ' + t));
  // It must not become a dependency of `npm test` (AGENTS.md: no deps).
  assert.match(spec, /try \{\n  pw = require\('@playwright\/test'\);/);
});

test('the offline cache was bumped and holds the music engine', () => {
  const sw = read('sw.js');
  const m = sw.match(/const CACHE = 'melodymath-offline-v(\d+)'/);
  assert.ok(m, 'CACHE constant not found');
  assert.ok(Number(m[1]) > 9, 'CACHE is still v' + m[1] + '; #101 changed index.html and core.js');
  assert.ok(sw.includes("'./src/lib/musicEngine.js'"), 'musicEngine.js is not precached');
});
