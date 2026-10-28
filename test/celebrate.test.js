// #665 req 4 / re-do of #818: MM_CELEBRATE on a correct answer.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const celebrateSrc = fs.readFileSync(path.join(root, 'src/lib/celebrate.js'), 'utf8');
const { celebrate, celebrateAnswerIn, CLASS_NAME } = require('../src/lib/celebrate');

// A function body from index.html: one-liners end at the line break, multi-line ones at a column-0 `}`.
function fnBody(name) {
  const start = indexHtml.indexOf(`\nfunction ${name}(`);
  assert.ok(start >= 0, `function ${name} found in index.html`);
  const lineEnd = indexHtml.indexOf('\n', start + 1);
  const firstLine = indexHtml.slice(start + 1, lineEnd);
  if (!firstLine.trimEnd().endsWith('{')) return firstLine;
  const end = indexHtml.indexOf('\n}\n', start + 1);
  return indexHtml.slice(start + 1, end + 2);
}

function fakeEl(log, has = true) {
  const classes = new Set(has ? [CLASS_NAME] : []);
  return {
    classes,
    classList: {
      remove(c) { log.push('remove:' + c); classes.delete(c); },
      add(c) { log.push('add:' + c); classes.add(c); },
      contains(c) { return classes.has(c); },
    },
    get offsetWidth() { log.push('layout'); return 10; },
  };
}

test('celebrate restarts the animation: remove, read layout, then add', () => {
  const log = [];
  const el = fakeEl(log);
  assert.equal(celebrate(el), el);
  assert.deepEqual(log, ['remove:mm-celebrate', 'layout', 'add:mm-celebrate']);
  assert.ok(el.classes.has('mm-celebrate'));
});

test('celebrate is null-safe', () => {
  assert.equal(celebrate(null), null);
  assert.equal(celebrate(undefined), null);
  assert.equal(celebrate({}), null);
});

test('celebrateAnswerIn animates the first <b> in the box and is null-safe', () => {
  const log = [];
  const b = fakeEl(log, false);
  const asked = [];
  const box = { querySelector(sel) { asked.push(sel); return b; } };
  assert.equal(celebrateAnswerIn(box), b);
  assert.deepEqual(asked, ['b']);
  assert.ok(b.classes.has('mm-celebrate'));
  assert.equal(celebrateAnswerIn(null), null);
  assert.equal(celebrateAnswerIn({}), null);
  assert.equal(celebrateAnswerIn({ querySelector: () => null }), null, 'no <b> → nothing to animate');
});

test('CSS: keyframes, picked-good override and reduced-motion rule', () => {
  assert.match(indexHtml, /@keyframes mmCelebrate\{0%\{transform:scale\(1\)\}50%\{transform:scale\(1\.4\)\}100%\{transform:scale\(1\.15\)\}\}/);
  assert.match(indexHtml, /@keyframes mmSparkle\{/);
  assert.match(indexHtml, /\.mm-celebrate\{[^}]*animation:mmCelebrate \.6s/);
  assert.match(indexHtml, /\.choice\.picked-good\.mm-celebrate\{animation:mmCelebrate/);
  const rm = indexHtml.match(/@media \(prefers-reduced-motion:reduce\)\{\.mm-celebrate[^\n]*/);
  assert.ok(rm, 'reduced-motion rule for .mm-celebrate');
  assert.match(rm[0], /animation:none!important/);
  assert.match(rm[0], /font-size:1\.2em/);
  assert.match(rm[0], /outline:3px solid #ffd600/);
  assert.match(rm[0], /\.mm-celebrate::after\{content:none/, 'no sparkle under reduced motion');
});

test('script is on the page and precached by the service worker', () => {
  assert.match(indexHtml, /<script src="src\/lib\/celebrate\.js"><\/script>/);
  assert.match(swJs, /'\.\/src\/lib\/celebrate\.js'/);
});

test('each correct-answer path calls MM_CELEBRATE inside its own function', () => {
  const sites = {
    check: /if\(correct&&typeof MM_CELEBRATE!=='undefined'\)MM_CELEBRATE\.celebrateAnswerIn\(\$\('feedback'\)\)/,
    rmCheck: /if\(correct&&typeof MM_CELEBRATE!=='undefined'\)MM_CELEBRATE\.celebrateAnswerIn\(\$\('rmFeedback'\)\)/,
    rpCheck: /if\(correct&&typeof MM_CELEBRATE!=='undefined'\)MM_CELEBRATE\.celebrateAnswerIn\(\$\('rmPlanFeedback'\)\)/,
    pickClass: /else if\(typeof MM_CELEBRATE!=='undefined'\)MM_CELEBRATE\.celebrate\(btn\)/,
    finishBeatPick: /if\(correct && !late && typeof MM_CELEBRATE!=='undefined'\) MM_CELEBRATE\.celebrate\(b\)/,
    renderStepQuiz: /if \(res\.correct\) \{\s*if \(typeof MM_CELEBRATE !== 'undefined'\) MM_CELEBRATE\.celebrate\(btn\)/,
    renderFractionBuilderUI: /if \(isPerfect && typeof MM_CELEBRATE !== 'undefined'\) MM_CELEBRATE\.celebrate\(\$\('fbTotal'\)\)/,
  };
  for (const [name, re] of Object.entries(sites)) assert.match(fnBody(name), re, name);
  assert.match(fnBody('renderFractionBuilderUI'), /<span id="fbTotal"/);
  assert.equal((indexHtml.match(/MM_CELEBRATE\.celebrate/g) || []).length, 7, 'exactly the 7 call sites');
});

test('the pre/post check (ppPick) does not celebrate', () => {
  assert.doesNotMatch(fnBody('ppPick'), /MM_CELEBRATE|mm-celebrate/);
});

test('no-music path: celebrate is pure CSS/DOM with no audio dependency', () => {
  assert.doesNotMatch(celebrateSrc, /Audio|Tone|sonify|play|speak|oscillator|MM_SOUND/i);
});

function runPickClass(value) {
  const log = [];
  const mk = (text) => ({ textContent: text, disabled: false, classList: { add(c) { log.push(text + ':' + c); }, remove(c) { log.push(text + ':-' + c); } }, get offsetWidth() { return 1; } });
  const choices = [mk('12'), mk('15')];
  const btn = choices.find((c) => c.textContent === value);
  const el = () => ({ className: '', innerHTML: '' });
  const els = { classChoices: { children: choices }, classFeedback: el() };
  // No AudioContext, no sound helpers: the muted / audio-unavailable path.
  const sandbox = {
    classAnswered: false, classEndsAt: 0, classHist: [],
    classCurrent: { id: 'x', skill: 's', prompt: '3×4', answer: '12', hint: 'h' },
    isCorrect: (a, b) => String(a) === String(b), noteMetro() {}, logTeacherItem() {},
    $: (id) => els[id] || el(), mathHtml: (s) => s, show() {}, revealWidget() {},
    preferLessMotion: () => true, prefsNow: () => ({}), setTimeout() {}, nextClassQuestion() {},
  };
  vm.createContext(sandbox);
  vm.runInContext(celebrateSrc, sandbox);
  vm.runInContext(fnBody('pickClass'), sandbox);
  assert.ok(sandbox.MM_CELEBRATE, 'celebrate.js registers MM_CELEBRATE in the browser');
  sandbox.pickClass(value, btn);
  return log;
}

test('pickClass: a right tap celebrates the tapped button', () => {
  const log = runPickClass('12');
  assert.ok(log.includes('12:mm-celebrate'), log.join(','));
  assert.ok(!log.includes('15:mm-celebrate'));
});

test('pickClass: a wrong tap does not celebrate anything', () => {
  const log = runPickClass('15');
  assert.ok(log.includes('15:picked-bad'));
  assert.ok(!log.some((l) => l.endsWith(':mm-celebrate')), log.join(','));
});
