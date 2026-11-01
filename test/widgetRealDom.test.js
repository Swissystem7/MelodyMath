'use strict';
// A real browser's element.children is a read-only HTMLCollection: writing
// children.length throws in strict mode. The widgets must clear through
// innerHTML only, or the pattern and worked-example screens stay blank.
const test = require('node:test');
const assert = require('node:assert/strict');
const PW = require('../src/lib/exercises/patternAndWorkedExample.js');

function makeEl(tag) {
  const kids = [];
  let text = '';
  const el = {
    tagName: tag, className: '', type: '', hidden: false, style: {},
    appendChild(c) { kids.push(c); return c; },
    get children() { return Object.freeze(kids.slice()); },
    get innerHTML() { return ''; },
    set innerHTML(v) { kids.length = 0; text = String(v); },
    get textContent() { return kids.length ? kids.map((c) => c.textContent).join('') : text; },
    set textContent(v) { text = String(v); kids.length = 0; },
  };
  return el;
}
const doc = { createElement: makeEl };
function host() { const h = makeEl('div'); h.ownerDocument = doc; return h; }
function find(el, cls) {
  for (const c of el.children) {
    if ((' ' + c.className + ' ').includes(' ' + cls + ' ')) return c;
    const f = find(c, cls); if (f) return f;
  }
  return null;
}
const quiet = { playTap() {}, later() { return 0; } };

test('frozen children: writing length throws, like an HTMLCollection', () => {
  assert.throws(() => { 'use strict'; host().children.length = 0; }, TypeError);
});

test('pattern widget renders its sequence and choices on a read-only children DOM', () => {
  const h = host();
  const ex = PW.createPatternCompletionExercise({ pattern: ['דו', 'מי', 'דו', 'מי'], expected: 'דו' });
  assert.doesNotThrow(() => PW.renderPatternWidget(h, ex, quiet));
  const seq = find(h, 'pattern-sequence');
  assert.ok(seq, 'renders the sequence');
  assert.equal(seq.textContent, 'דו➔מי➔דו➔?');
  const choices = find(h, 'pattern-choices');
  assert.ok(choices, 'renders the choices row');
  assert.equal(choices.children.length, 3);
});

test('worked-example widget steps through all three stages without touching children.length', () => {
  const h = host();
  const ex = PW.createWorkedExampleExercise({ a: 2, b: 3, total: 5 });
  assert.doesNotThrow(() => PW.renderWorkedExampleWidget(h, ex, quiet));
  assert.equal(h._stage, 'demo');
  const demoBtn = find(h, 'demo-proceed-btn');
  assert.ok(demoBtn, 'renders the הבנתי button');

  // Move from demo to completion
  assert.doesNotThrow(() => demoBtn.onclick());
  assert.equal(h._stage, 'completion');
  const tapBtn = find(h, 'completion-tap-btn');
  assert.ok(tapBtn, 'renders the completion tap button');

  // Move from completion to independent
  assert.doesNotThrow(() => tapBtn.onclick());
  assert.equal(h._stage, 'independent');
  const input = find(h, 'worked-answer');
  assert.ok(input, 'renders the input for עכשיו לבד');
});
