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
    onAnswer: function () { filled++; }, getAnswer: function () { return '5'; }, later: function (fn) { fn(); }
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

// ---------- Refs #835: wrong answer stays put; the no-music check is silent and spoiler-free ----------
const vmMod = require('node:vm');
const fsMod = require('node:fs');
const pathMod = require('node:path');
const INDEX = fsMod.readFileSync(pathMod.join(__dirname, '..', 'index.html'), 'utf8');
const fnLine = (name) => INDEX.match(new RegExp('^function ' + name + '\\(.*$', 'm'))[0];
function treeText(n) {
  let s = String(n.textContent || '');
  for (const k of Object.keys(n)) if (k !== 'textContent' && k !== 'children' && k !== 'ownerDocument' && typeof n[k] === 'string') s += ' ' + n[k];
  for (const c of n.children || []) s += ' ' + treeText(c);
  return s;
}

test('#835 worked example: a wrong independent answer keeps the stage and the hint has no digits', () => {
  const ind = PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'independent' });
  const res = ind.check(4);
  assert.equal(res.correct, false);
  assert.equal(res.next, 'independent');
  assert.equal(/\d/.test(res.hint), false, res.hint);
  assert.equal(/\d/.test(res.feedback), false, res.feedback);
  assert.equal(/\d/.test(PW.retryHint(ind)), false);
  assert.equal(PW.retryHint(ind), '🥁🥁🥁 ➕ 🔔🔔 — ספרו את כל הצלילים.');
  assert.equal(ind.hint, '3 ועוד 2 הם 5 צלילים', 'hint is the post-correct explanation');
  assert.equal(ind.check(5).hint, '');
  assert.equal(PW.retryHint(PW.createPatternCompletionExercise()), 'אחרי דו בא מי, ושוב דו, ואז מי.');
  assert.equal(PW.createWorkedExampleExercise({ stage: 'completion' }).check(0).next, 'demo');
});

test('#835 the עכשיו לבד screen hides the total and makes zero sound calls', () => {
  const heard = [];
  const host = box();
  const ex = PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'demo' });
  PW.renderWorkedExampleWidget(host, ex, { playTap: (v) => heard.push(v), later: (fn) => fn() });
  find(host, 'demo-proceed-btn').onclick();
  find(host, 'completion-tap-btn').onclick();
  assert.equal(host._stage, 'independent');
  heard.length = 0;
  assert.equal(host._silent, true);
  assert.equal(/5/.test(treeText(host)), false, 'total must not appear before a correct submit');
  const hint = find(host, 'mm-ex-hint');
  assert.equal(hint.hidden, true);
  host._retry();
  assert.equal(hint.hidden, false);
  assert.equal(/\d/.test(hint.textContent), false);
  assert.equal(/5/.test(treeText(host)), false);
  assert.deepEqual(heard, [], 'no audio on the no-music screen');
});

test('#835 the bank worked example prompt and retry hint do not leak the answer', () => {
  const it = require('../src/lib/banks.js').allItems().find((x) => x.kind === 'worked_example');
  assert.equal(it.answer, 5);
  assert.equal(it.prompt, '3 תופים ועוד 2 פעמונים. כמה צלילים ביחד?');
  assert.equal(/5/.test(it.prompt), false, it.prompt);
  assert.equal(/\d/.test(PW.retryHint(it)), false, PW.retryHint(it));
  assert.equal(it.hint, '3 ועוד 2 הם 5 צלילים');
  assert.ok(PW.countWords(it.prompt) <= 15);
});

test('#835 a demo started before the tap never sounds once עכשיו לבד is on screen', () => {
  const heard = [], queue = [];
  const host = box();
  const ex = PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'demo' });
  PW.renderWorkedExampleWidget(host, ex, { playTap: (v) => heard.push(v), later: (fn) => queue.push(fn), clearLater() {} });
  find(host, 'demo-listen-btn').onclick();
  assert.equal(heard.length, 0, 'demo notes are only scheduled');
  find(host, 'demo-proceed-btn').onclick();
  find(host, 'completion-tap-btn').onclick();
  assert.deepEqual(heard, ['drum'], 'the completion drum plays right away');
  assert.equal(host._stage, 'completion');
  queue.pop()();
  assert.equal(host._stage, 'independent');
  assert.deepEqual(host._timers, [], 'pending demo timers are cleared');
  heard.length = 0;
  queue.splice(0).forEach((fn) => fn());
  assert.deepEqual(heard, [], 'zero play calls on the independent stage');
});

function planCtx(stage) {
  const calls = [];
  const els = {};
  const el = (id) => els[id] || (els[id] = { id, value: '', disabled: false, className: '', textContent: '', innerHTML: '', hidden: true, focus() {} });
  const spy = (name) => function () { calls.push(name); };
  const ctx = {
    MM_PATTERN_WORKED: PW, $: el, PLAN_PER_SKILL: 5,
    show: (id, on) => { el(id).hidden = !on; },
    normalizeAnswer: (v) => String(v).trim(), askForAnswer: spy('askForAnswer'),
    answerOk: (it, v) => Number(v) === Number(it.answer), mathHtml: (s) => String(s),
    nextLevel: (lv) => lv, logTeacherItem() {}, answerHint: (it) => it.hint, musicSourceHtml: () => '', revealWidget() {},
    musicEngine: { audioState: { muted: false } },
    noteMetro: () => calls.push(ctx.mmHushNow() && ctx.musicEngine.audioState.muted ? 'noteMetro(hushed)' : 'noteMetro(loud)'),
    playTap: spy('playTap'), playDemo: spy('playDemo'), maybeHear: spy('maybeHear'), maybeSpeak: spy('maybeSpeak'),
    playLevelTune: spy('playLevelTune'), AudioContext: spy('AudioContext'),
  };
  vmMod.createContext(ctx);
  vmMod.runInContext('let mmHush=false,mmHushWas=false,rpAnswered=false,rpHoldStreak=false,rpStep=0;var mmHushNow=()=>mmHush;' + fnLine('hushAudio') + '\n' + fnLine('stayOnWrong') + '\n' + fnLine('rpCheck'), ctx);
  const item = PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'demo' });
  ctx.rmPlan = [{ he: 'חיבור', current: item, history: [] }];
  const host = el('rmPlanWidget');
  Object.assign(host, box());
  PW.renderWorkedExampleWidget(host, item, { playTap: spy('playTap'), later: (fn) => fn() });
  if (stage !== 'demo') { find(host, 'demo-proceed-btn').onclick(); find(host, 'completion-tap-btn').onclick(); }
  calls.length = 0;
  return { ctx, el, calls, host, answered: () => vmMod.runInContext('rpAnswered', ctx) };
}

test('#835 rpCheck: a wrong answer stays on the same item with a written hint and no sound', () => {
  const { ctx, el, calls, host, answered } = planCtx('independent');
  el('rmPlanAnswer').value = '4';
  ctx.rpCheck();
  assert.equal(answered(), false);
  assert.equal(el('rmPlanNext').hidden, true, 'no Next on a wrong answer');
  assert.equal(ctx.rmPlan[0].history.length, 0);
  assert.equal(el('rmPlanFeedback').hidden, false);
  assert.equal(/התשובה|5/.test(el('rmPlanFeedback').innerHTML), false, el('rmPlanFeedback').innerHTML);
  assert.equal(el('rmPlanFeedback').innerHTML, '<strong>כמעט! נסו שוב.</strong>', 'the widget shows the hint, not the feedback');
  assert.equal(el('rmPlanFeedback').innerHTML.includes(ctx.rmPlan[0].current.hint), false);
  assert.equal(ctx.rmPlan[0].hints, 1);
  assert.equal(el('rmPlanAnswer').value, '');
  assert.equal(el('rmPlanAnswer').disabled, false);
  assert.equal(find(host, 'mm-ex-hint').hidden, false);
  assert.deepEqual(calls, []);
  el('rmPlanAnswer').value = '5';
  ctx.rpCheck();
  assert.equal(answered(), true);
  assert.equal(ctx.rmPlan[0].history[0].correct, false, 'a correct answer after a miss does not count toward nextLevel');
  assert.match(el('rmPlanFeedback').innerHTML, /3 ועוד 2 הם 5 צלילים\. התשובה/);
  assert.equal(/נסו שוב/.test(el('rmPlanFeedback').innerHTML), false);
  assert.deepEqual(calls, ['noteMetro(hushed)'], 'reward sounds stay off on the no-music check');
  assert.equal(ctx.mmHushNow(), false);
  assert.equal(ctx.musicEngine.audioState.muted, false, 'the mute is lifted after scoring');
});

test('#835 rpCheck: two misses on עכשיו לבד bring back the demo, silently', () => {
  const { ctx, el, calls, host, answered } = planCtx('independent');
  for (const v of ['4', '6']) { el('rmPlanAnswer').value = v; ctx.rpCheck(); }
  assert.equal(answered(), false);
  assert.equal(host._stage, 'demo');
  assert.equal(el('rmPlanFeedback').textContent, 'בואו נראה שוב את ההדגמה');
  assert.equal(ctx.rmPlan[0].current._misses, 0);
  assert.equal(ctx.rmPlan[0].hints, 2);
  assert.deepEqual(calls, []);
  el('rmPlanAnswer').value = '5';
  ctx.rpCheck();
  assert.equal(answered(), false, 'the demo gate applies again');
});

test('#835 rpCheck: the answer cannot be typed during the demo', () => {
  const { ctx, el, calls, answered } = planCtx('demo');
  el('rmPlanAnswer').value = '5';
  ctx.rpCheck();
  assert.equal(answered(), false);
  assert.match(el('rmPlanFeedback').textContent, /קודם הקשיבו והשלימו/);
  assert.deepEqual(calls, []);
});

test('#835 practice check(): a wrong worked-example answer retries before the maybeHear/maybeSpeak branch', () => {
  assert.match(fnLine('check'), /if\(!correct&&stayOnWrong\(current,null,'feedback','answer'\)\)\{[^}]*return;\}if\(!correct&&current&&!current\._retryDone/);
});
