// MelodyMath — Pattern Completion & Worked Example Tests (Issue #670, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');

const PW = require('../src/lib/exercises/patternAndWorkedExample.js');

test('pattern completion exercise creates sound-first model with <= 15 words', () => {
  const ex = PW.createPatternCompletionExercise({
    pattern: ['דו', 'מי', 'דו', 'מי'],
    expected: 'דו',
    choices: ['דו', 'מי', 'סול']
  });

  assert.equal(ex.kind, 'pattern_completion');
  assert.equal(ex.grade, 'א');
  assert.equal(ex.expected, 'מי');
  assert.equal(PW.shownText(ex.pattern), 'דו➔מי➔דו➔?');
  assert.ok(ex.wordCount <= 15, `Word count ${ex.wordCount} exceeds 15 words`);
  assert.equal(ex.hasMusic, true);
  assert.equal(ex.soundEvents.length, 4);
  assert.equal(ex.check('מי').correct, true);
  assert.equal(ex.check('דו').correct, false);
  assert.equal(ex.check('דו').status, 'retry');
});

test('worked example implements fading and restoration of scaffolding on mistake', () => {
  // Step 1: Demo
  const demoEx = PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'demo' });
  assert.equal(demoEx.kind, 'worked_example');
  assert.equal(demoEx.stage, 'demo');
  assert.ok(demoEx.wordCount <= 15);
  assert.equal(demoEx.nextStage(true), 'completion');

  // Step 2: Completion
  const compEx = PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'completion' });
  assert.equal(compEx.stage, 'completion');
  assert.ok(compEx.wordCount <= 15);
  assert.equal(compEx.answer, 1, 'completion step requires 1 final action');
  assert.equal(compEx.check(1).correct, true);
  assert.equal(compEx.check(1).next, 'independent');

  // Expertise reversal / mistake handling: error restores demo support
  assert.equal(compEx.check(0).correct, false);
  assert.equal(compEx.check(0).next, 'demo');

  // Step 3: Independent
  const indEx = PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'independent' });
  assert.equal(indEx.stage, 'independent');
  assert.ok(indEx.wordCount <= 15);
  assert.equal(indEx.answer, 5);
  assert.equal(indEx.check(5).correct, true);
  assert.equal(indEx.check(5).next, 'mastered');
});

test('validation rejects prompts exceeding 15 words or missing standards', () => {
  const longPrompt = 'זהו תרגיל שבו אנחנו בודקים האם המשפט ארוך מדי עבור ילדים צעירים ולכן המערכת חייבת לחסום אותו';
  const invalid = PW.validateExerciseCard({
    prompt: longPrompt,
    standard: 'סדרות דגמים צורניים',
    kind: 'pattern_completion'
  });
  assert.equal(invalid.valid, false);
  assert.match(invalid.reason, /exceeds 15 words/);

  const missingStd = PW.validateExerciseCard({
    prompt: 'קצר ולעניין',
    kind: 'pattern_completion'
  });
  assert.equal(missingStd.valid, false);
  assert.match(missingStd.reason, /missing curriculum standard/);
});

function box() {
  function node() {
    const children = [];
    const n = { style: {}, className: '', textContent: '', hidden: false, children: children };
    n.appendChild = function (c) { children.push(c); return c; };
    // Like the DOM: assigning innerHTML drops the old children.
    Object.defineProperty(n, 'innerHTML', { get() { return ''; }, set() { children.length = 0; } });
    return n;
  }
  const host = node();
  host.ownerDocument = { createElement: node };
  return host;
}
function find(n, cls) {
  if (n.className && n.className.split(' ').includes(cls)) return n;
  for (const c of n.children || []) { const h = find(c, cls); if (h) return h; }
  return null;
}

test('the pattern on screen is דו➔מי➔דו➔? and the answer is מי', () => {
  const host = box(), heard = [];
  const ex = PW.createPatternCompletionExercise({ pattern: ['דו', 'מי', 'דו', 'מי'], expected: 'דו' });
  ex.research = 'Azaryahu 2020 https://doi.org/10.1080/00220973.2020.1799316';
  PW.renderPatternWidget(host, ex, { playTap: function (v) { heard.push(v); }, later: function (fn) { fn(); } });
  find(host, 'demo-listen-btn').onclick();
  assert.equal(find(host, 'pattern-sequence').textContent, 'דו➔מי➔דו➔?'); assert.equal(/doi|http|Journal/i.test(host.textContent), false);
  assert.equal(ex.answer, 'מי'); assert.equal(ex.check('מי').correct, true); assert.deepEqual(heard, ['xylo', 'xylo', 'xylo']);
  assert.equal(find(host, 'pattern-choice-btn').style.minHeight, '44px');
});

test('הקשיבו להדגמה plays 3 drums, 2 bells, then 5', () => {
  const heard = [];
  const host = box();
  PW.renderWorkedExampleWidget(host, { a: 3, b: 2, total: 5, stage: 'demo', research: 'Sweller 1985 https://doi.org/10.1207/s1532690xci0201_3' }, {
    playTap: function (v) { heard.push(v); }, later: function (fn) { fn(); }
  });
  find(host, 'demo-listen-btn').onclick();
  assert.equal(heard.filter(function (v) { return v === 'drum'; }).length, 3);
  assert.equal(heard.filter(function (v) { return v === 'bell'; }).length, 2);
  assert.equal(heard.filter(function (v) { return v === 'xylo'; }).length, 5);
  assert.equal(/doi|http|Journal/i.test(host.textContent), false);
});

test('הבנתי moves on and does not fill the answer', () => {
  let filled = 0;
  const host = box();
  PW.renderWorkedExampleWidget(host, PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'demo' }), {
    onAnswer: function () { filled++; }, getAnswer: function () { return '5'; }
  });
  find(host, 'demo-proceed-btn').onclick();
  assert.equal(host._stage, 'completion');
  assert.equal(filled, 0);
  assert.equal(host._filled, false);
  find(host, 'completion-tap-btn').onclick();
  assert.equal(host._stage, 'independent');
  assert.equal(filled, 0);
  assert.equal(find(host, 'mm-try-btn'), null);
});

test('a wrong answer shows the hint and does not fill the choice', () => {
  let filled = 0;
  const heard = [];
  const host = box();
  PW.renderPatternWidget(host, PW.createPatternCompletionExercise(), {
    onAnswer: function () { filled++; }, playTap: function (v, o) { heard.push(o && o.hz); }
  });
  const wrong = find(host, 'pattern-choice-btn');
  assert.equal(wrong.textContent, 'דו');
  wrong.onclick();
  assert.equal(filled, 0);
  assert.equal(heard[0], 261.63);
  const hint = find(host, 'mm-ex-hint');
  assert.equal(hint.hidden, false);
  assert.match(hint.textContent, /מי/);
});


test('banks include pattern completion and worked example, and index.html wires them', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const banks = require('../src/lib/banks.js');
  const all = banks.allItems();

  const patternItems = all.filter(it => it.kind === 'pattern_completion');
  const workedItems = all.filter(it => it.kind === 'worked_example');

  assert.ok(patternItems.length >= 1, 'pattern completion item must exist in banks');
  assert.ok(workedItems.length >= 1, 'worked example item must exist in banks');

  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('src/lib/exercises/patternAndWorkedExample.js'), 'script must be loaded in index.html');
  assert.ok(indexHtml.includes('MM_PATTERN_WORKED.renderPatternWidget'), 'pattern widget must be wired in renderWidget');
  assert.ok(indexHtml.includes('MM_PATTERN_WORKED.renderWorkedExampleWidget'), 'worked example widget must be wired in renderWidget');
  assert.equal(indexHtml.includes('fill(item.total)'), false);
  assert.equal(patternItems[0].answer, 'מי');
  assert.ok(patternItems[0].research.includes('10.1080/00220973.2020.1799316') && workedItems[0].research.includes('10.1207/s1532690xci0201_3') && /if \(raw\.a != null\)/.test(fs.readFileSync(path.join(__dirname, '..', 'src/lib/banks.js'), 'utf8')));
  assert.equal(PW.shownText(patternItems[0].pattern), 'דו➔מי➔דו➔?');
});
