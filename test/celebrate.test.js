// #665 requirement 4: after a correct answer, a short animation and the answer
// grows, on every screen where the child answers; prefers-reduced-motion is kept.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const C = require('../src/lib/celebrate');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

function fakeEl() {
  const classes = new Set();
  const log = [];
  return {
    log,
    get offsetWidth() { log.push('layout'); return 40; },
    classList: {
      add: (c) => { classes.add(c); log.push('+' + c); },
      remove: (c) => { classes.delete(c); log.push('-' + c); },
      contains: (c) => classes.has(c),
    },
  };
}

test('celebrate restarts the animation: remove, read layout, add', () => {
  const el = fakeEl();
  assert.equal(C.celebrate(el), true);
  assert.equal(C.celebrate(el), true);
  assert.deepEqual(el.log, ['-mm-celebrate', 'layout', '+mm-celebrate', '-mm-celebrate', 'layout', '+mm-celebrate']);
  assert.ok(el.classList.contains(C.CLASS));
  assert.equal(C.celebrate(null), false);
  assert.equal(C.celebrate({}), false);
});

test('celebrateAnswerIn grows the <b> that holds the answer', () => {
  const b = fakeEl();
  const box = { querySelector: (sel) => (sel === 'b' ? b : null) };
  assert.equal(C.celebrateAnswerIn(box), true);
  assert.ok(b.classList.contains('mm-celebrate'));
  assert.equal(C.celebrateAnswerIn({ querySelector: () => null }), false);
  assert.equal(C.celebrateAnswerIn(null), false);
});

test('the CSS scales the answer up with a sparkle, and stands still under reduced motion', () => {
  assert.match(html, /\.mm-celebrate,\.choice\.picked-good\.mm-celebrate\{[^}]*animation:mmCelebrate \.6s/);
  const kf = html.match(/@keyframes mmCelebrate\{(.*?)\}\}/)[1];
  assert.match(kf, /scale\(1\.4\)/, 'grows');
  assert.match(kf, /100%\{transform:scale\(1\.15\)/, 'and stays a little bigger');
  assert.match(html, /\.mm-celebrate::after\{content:'✨'[^}]*animation:mmSpark/);
  const still = html.match(/@media \(prefers-reduced-motion:reduce\)\{\.mm-celebrate\{([^}]*)\}([^}]*)\}/);
  assert.ok(still, 'a reduced-motion rule for .mm-celebrate');
  assert.match(still[1], /animation:none!important/);
  assert.match(still[1], /transform:none!important/);
  assert.match(still[1], /font-size:1\.2em/, 'the answer is still bigger, without motion');
  assert.match(still[2], /\.mm-celebrate::after\{content:none/);
});

test('the module is on the page and in the offline cache', () => {
  assert.match(html, /<script src="src\/lib\/celebrate\.js"><\/script>/);
  assert.match(sw, /'\.\/src\/lib\/celebrate\.js'/);
});

// A function from index.html: one long line, or a block that ends with "\n}".
function fnSrc(name) {
  const at = html.indexOf('function ' + name + '(');
  assert.ok(at >= 0, name + ' is in index.html');
  const line = html.slice(at, html.indexOf('\n', at));
  if (line.trimEnd().endsWith('}')) return line;
  const end = html.slice(at).search(/\r?\n\}\r?\n/);
  assert.ok(end > 0, name + ' ends with a closing brace');
  return html.slice(at, at + end) + '\n}';
}

test('every screen where the child answers celebrates a correct answer', () => {
  const sites = {
    check: /show\('feedback',true\);if\(correct&&typeof MM_CELEBRATE!=='undefined'\)MM_CELEBRATE\.celebrateAnswerIn\(\$\('feedback'\)\)/,
    rmCheck: /if\(correct&&typeof MM_CELEBRATE!=='undefined'\)MM_CELEBRATE\.celebrateAnswerIn\(\$\('rmFeedback'\)\)/,
    rpCheck: /if\(correct&&typeof MM_CELEBRATE!=='undefined'\)MM_CELEBRATE\.celebrateAnswerIn\(\$\('rmPlanFeedback'\)\)/,
    pickClass: /if\(!correct\)btn\.classList\.add\('picked-bad'\);else if\(typeof MM_CELEBRATE!=='undefined'\)MM_CELEBRATE\.celebrate\(btn\)/,
    finishBeatPick: /if\(correct && !late && typeof MM_CELEBRATE!=='undefined'\) MM_CELEBRATE\.celebrate\(b\)/,
    renderStepQuiz: /if \(res\.correct\) \{\s*if \(typeof MM_CELEBRATE !== 'undefined'\) MM_CELEBRATE\.celebrate\(btn\)/,
    renderFractionBuilderUI: /if \(isPerfect && typeof MM_CELEBRATE !== 'undefined'\) MM_CELEBRATE\.celebrate\(\$\('fbSum'\)\)/,
  };
  for (const [name, re] of Object.entries(sites)) assert.match(fnSrc(name), re, name);
  assert.match(html, /<span id="fbSum"/);
});

test('class mode: the tapped right answer grows, a wrong tap does not', () => {
  const src = fnSrc('pickClass');
  function run(value) {
    const kids = [fakeEl(), fakeEl()];
    kids[0].textContent = '7'; kids[1].textContent = '9';
    const els = { classChoices: { children: kids }, classFeedback: { className: '', innerHTML: '' } };
    const ctx = {
      MM_CELEBRATE: C, setTimeout: () => {}, Date,
      $: (id) => els[id],
      classAnswered: false, classCurrent: { id: 1, answer: 7, prompt: '3+4', hint: '' }, classHist: [], classEndsAt: 0,
      isCorrect: (a, b) => String(a) === String(b),
      noteMetro() {}, logTeacherItem() {}, mathHtml: (s) => s, show() {}, revealWidget() {},
      prefsNow: () => ({}), preferLessMotion: () => false, who: {},
    };
    vm.runInNewContext(src + '\npickClass(' + JSON.stringify(value) + ', classChoices.children[' + (value === 7 ? 0 : 1) + ']);', Object.assign(ctx, { classChoices: els.classChoices }));
    return kids;
  }
  const right = run(7);
  assert.ok(right[0].classList.contains('mm-celebrate'), 'right answer celebrated');
  const wrong = run(9);
  assert.ok(!wrong[0].classList.contains('mm-celebrate') && !wrong[1].classList.contains('mm-celebrate'), 'nothing celebrated on a miss');
});
