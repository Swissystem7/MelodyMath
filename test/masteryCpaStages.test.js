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
  assert.match(box.innerHTML, /data-stage="symbol"/, 'second miss shows the answer and moves on');
  assert.ok(box.innerHTML.includes('התשובה היא 7'));
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
