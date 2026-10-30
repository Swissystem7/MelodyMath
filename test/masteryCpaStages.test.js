// Picture -> symbol stages before the plain no-music mastery check (Refs #665 req 5).
const test = require('node:test');
const assert = require('node:assert/strict');
const Mastery = require('../src/lib/masteryCheck.js');

const BRIDGE = { id: 'b', prompt: '3 + 4 = ?', answer: 7, skill: 'addition', grade: 'א' };
const CHECK = { prompt: '5 + 2 = ?', answer: 7 };
const count = (s, re) => (s.match(re) || []).length;

function mockStorage() {
  const store = new Map();
  return { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)) };
}
// Container stub: each innerHTML assignment is recorded; stage widgets are fresh per mount.
function mockContainer() {
  const box = { history: [], hidden: true, widgets: null };
  box.classList = { remove: () => { box.hidden = false; }, add: () => { box.hidden = true; } };
  let html = '';
  Object.defineProperty(box, 'innerHTML', {
    get: () => html,
    set: v => {
      html = v; box.history.push(v);
      box.widgets = { input: { value: '', onkeydown: null, focus() {} }, submit: { onclick: null }, msg: { textContent: '' } };
    }
  });
  box.querySelector = sel => {
    if (!box.widgets) return null;
    if (sel === '.mm-cpa-input' || sel === '.plain-answer-input') return box.widgets.input;
    if (sel === '.mm-cpa-submit' || sel === '.plain-submit-btn') return box.widgets.submit;
    if (sel === '.mm-cpa-msg') return box.widgets.msg;
    return null;
  };
  box.querySelectorAll = () => [];
  box.answer = val => { box.widgets.input.value = val; box.widgets.submit.onclick(); };
  return box;
}
function mockCtx() {
  const c = { suspended: 0, resumed: 0 };
  c.suspend = () => { c.suspended++; return Promise.resolve(); };
  c.resume = () => { c.resumed++; return Promise.resolve(); };
  return c;
}
const stageOf = h => h.includes('mm-plain-mastery-check') ? 'plain' : ((h.match(/data-stage="(\w+)"/) || [])[1] || '');

test('picture -> symbol -> plain: dots first, then symbols, music suspended only at plain', () => {
  const box = mockContainer(), ctx = mockCtx();
  const tracker = Mastery.createMasteryTracker({ storage: mockStorage() });
  Mastery.mountMasteryCheck(box, CHECK, { bridgeItem: BRIDGE, audioContext: ctx, tracker, topicId: 'mm-cur-0' });
  assert.match(box.innerHTML, /data-stage="picture"/);
  assert.equal(count(box.innerHTML, /class="np-dot"/g), 7, '3 + 4 shows 7 dots');
  assert.equal(count(box.innerHTML, /class="np-group"/g), 2, 'in 2 groups');
  assert.equal(box.innerHTML.includes('mm-plain-mastery-check'), false);
  assert.equal(ctx.suspended, 0, 'no suspend during picture stage');
  box.answer('7');
  assert.match(box.innerHTML, /data-stage="symbol"/);
  assert.ok(box.innerHTML.includes('3 + 4'), 'symbol stage shows 3 + 4');
  assert.equal(box.innerHTML.includes('mm-plain-mastery-check'), false);
  assert.equal(ctx.suspended, 0, 'no suspend during symbol stage');
  box.answer('7');
  assert.ok(box.innerHTML.includes('mm-plain-mastery-check'), 'plain no-sound stage reached');
  assert.equal(ctx.suspended, 1, 'suspend called once, at plain');
  const order = box.history.map(stageOf);
  assert.deepEqual(order, ['picture', 'symbol', 'plain']);
  assert.ok(order.indexOf('picture') < order.indexOf('symbol') && order.indexOf('symbol') < order.indexOf('plain'));
});

test('wrong answer on picture stays on picture with the retry message', () => {
  const box = mockContainer(), ctx = mockCtx();
  Mastery.mountMasteryCheck(box, CHECK, { bridgeItem: BRIDGE, audioContext: ctx });
  box.answer('6');
  assert.match(box.innerHTML, /data-stage="picture"/);
  assert.equal(box.history.length, 1, 'not re-rendered to another stage');
  assert.equal(box.widgets.msg.textContent, 'נסתכל שוב על הדגם');
  assert.equal(ctx.suspended, 0);
  box.answer('6');
  assert.match(box.innerHTML, /data-stage="picture"/, 'second miss shows the answer but stays');
  assert.equal(box.history.length, 1);
  assert.ok(box.widgets.msg.textContent.includes('התשובה היא 7'));
  assert.equal(box.widgets.input.value, '', 'input cleared');
  box.answer('7');
  assert.match(box.innerHTML, /data-stage="symbol"/, 'only a correct answer advances');
  box.answer('5'); box.answer('5');
  assert.match(box.innerHTML, /data-stage="symbol"/);
  assert.equal(box.history.length, 2, 'two misses on symbol stay on symbol');
  assert.ok(box.widgets.msg.textContent.includes('התשובה היא 7'));
  assert.equal(ctx.suspended, 0);
  box.answer('7');
  assert.deepEqual(box.history.map(stageOf), ['picture', 'symbol', 'plain']);
});

test('sequence guard: stages follow STAGES via nextStage, no hardcoded transitions', () => {
  assert.deepEqual(Mastery.STAGES, ['sound', 'picture', 'symbol', 'plain']);
  const chain = [];
  for (let s = Mastery.nextStage('sound'); s; s = Mastery.nextStage(s)) chain.push(s);
  assert.deepEqual(chain, ['picture', 'symbol', 'plain']);
  assert.equal(Mastery.nextStage('plain'), null);
  assert.equal(Mastery.nextStage('x'), null);
  for (const s of ['sound', 'picture', 'symbol']) {
    assert.equal(Mastery.recordAttempt({ currentStage: s, history: [], soundSolvedCount: 0 }, { correct: true }).nextStage, Mastery.nextStage(s), 'recordAttempt agrees with STAGES at ' + s);
  }
  const box = mockContainer();
  Mastery.mountMasteryCheck(box, CHECK, { bridgeItem: BRIDGE, audioContext: mockCtx() });
  assert.deepEqual([...box.innerHTML.matchAll(/data-step="(\w+)"/g)].map(m => m[1]), Mastery.STAGES);
  assert.match(box.innerHTML, /data-step="sound">✓ /);
  assert.match(box.innerHTML, /data-step="picture" aria-current="step"/);
  box.answer('7'); box.answer('7');
  assert.deepEqual(box.history.map(stageOf), Mastery.STAGES.slice(1));
  const src = require('node:fs').readFileSync(require.resolve('../src/lib/masteryCheck.js'), 'utf8');
  assert.doesNotMatch(src, /mountStage\('(picture|symbol)'/);
});

test('no overlapping sounds: bridge stages play nothing, plain is silent', () => {
  const NP = require('../src/components/NumberPlay.js');
  const saved = { jam: global.MM_JAM, freq: global.playFreq };
  let calls = 0;
  global.MM_JAM = { playNotes: () => { calls++; return { stop() {} }; } };
  global.playFreq = () => { calls++; };
  try {
    const box = mockContainer(), ctx = mockCtx();
    Mastery.mountMasteryCheck(box, CHECK, { bridgeItem: BRIDGE, audioContext: ctx });
    box.answer('7'); box.answer('7');
    assert.equal(stageOf(box.innerHTML), 'plain');
    assert.equal(calls, 0, 'no player called during picture/symbol/plain');
    assert.equal(ctx.resumed, 0, 'not resumed before the plain answer');
    assert.equal(ctx.suspended, 1);
    assert.doesNotMatch(box.innerHTML, /np-btn|▶|<audio/);
  } finally {
    global.MM_JAM = saved.jam; global.playFreq = saved.freq;
  }
  const src = require('node:fs').readFileSync(require.resolve('../src/lib/masteryCheck.js'), 'utf8');
  assert.doesNotMatch(src, /playNotes|playFreq|maybeHear|\.play\(/);
  const at = NP.extractNumberPlan(BRIDGE).notes.map(n => n.at);
  assert.ok(at.every((t, i) => i === 0 || t > at[i - 1]), 'sound-stage notes never overlap');
});

test('sound stage plan uses at least 2 instrument families', () => {
  const plan = require('../src/components/NumberPlay.js').extractNumberPlan(BRIDGE);
  assert.ok(new Set(plan.groups.map(g => g.family)).size >= 2);
});

test('picture above 12 bundles tens and ones like NumberPlay', () => {
  const item = { prompt: '15 + 3 = ?', answer: 18, skill: 'addition', grade: 'א' };
  const box = mockContainer();
  Mastery.mountMasteryCheck(box, CHECK, { bridgeItem: item, audioContext: mockCtx() });
  const html = box.innerHTML;
  assert.equal(count(html, /class="np-dot[ "]/g), require('../src/components/NumberPlay.js').extractNumberPlan(item).totalSounds);
  assert.match(html, /np-ten/);
  const groups = html.match(/<span class="np-group">.*?<\/span><\/span>(?=<span class="np-gap"|<\/div>)/g);
  assert.equal(groups.length, 2);
  for (const g of groups) assert.ok(count(g, /class="np-dot"/g) <= 12, 'no group of more than 12 loose dots');
});

test('compare with a single heard number skips the bridge', () => {
  const box = mockContainer();
  Mastery.mountMasteryCheck(box, CHECK, { bridgeItem: { prompt: 'מה גדול יותר?', hear: '5', answer: '5', skill: 'compare' }, audioContext: mockCtx() });
  assert.deepEqual(box.history.map(stageOf), ['plain']);
});

test('no bridgeItem, or an unparsable one, renders plain immediately (unchanged)', () => {
  for (const bridgeItem of [undefined, { prompt: '1/2 = ?', answer: '1/2', skill: 'fractions' }]) {
    const box = mockContainer(), ctx = mockCtx();
    Mastery.mountMasteryCheck(box, CHECK, { bridgeItem, audioContext: ctx });
    assert.ok(box.innerHTML.includes('mm-plain-mastery-check'), 'plain right away');
    assert.equal(box.innerHTML.includes('data-stage='), false);
    assert.equal(box.history.length, 1);
    assert.equal(ctx.suspended, 1);
  }
});

test('no-music path: full flow works with audioContext undefined or null', () => {
  for (const audioContext of [undefined, null]) {
    const box = mockContainer();
    let result = null;
    const tracker = Mastery.createMasteryTracker({ storage: mockStorage() });
    assert.doesNotThrow(() => {
      const h = Mastery.mountMasteryCheck(box, CHECK, { bridgeItem: BRIDGE, audioContext, tracker, topicId: 'mm-cur-0', onAnswer: (v, ok) => { result = ok; } });
      assert.equal(global.MM_JAM, undefined, 'no jam player loaded');
      box.answer('6'); box.answer('6');
      assert.ok(box.widgets.msg.textContent.includes('התשובה היא 7'), 'wrong answer stays without audio');
      assert.equal(box.history.length, 1);
      box.answer('7');
      box.answer('7');
      assert.ok(box.innerHTML.includes('mm-plain-mastery-check'));
      box.answer('7');
      h.restoreAudio();
      h.close();
    });
    assert.deepEqual(box.history.map(stageOf), ['picture', 'symbol', 'plain']);
    assert.equal(result, true, 'plain answer judged correct without audio');
  }
});
