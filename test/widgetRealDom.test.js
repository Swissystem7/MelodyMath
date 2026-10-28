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
  PW.renderPatternWidget(h, ex, quiet);
  assert.ok(h.children.length > 0, 'container is not empty');
  assert.equal(find(h, 'pattern-sequence').textContent, 'דו➔מי➔דו➔?');
  assert.ok(find(h, 'pattern-choices').children.length >= 2, 'choice buttons rendered');
  PW.renderPatternWidget(h, ex, quiet);
  assert.equal(h.children.length, 1, 'a re-render replaces, not appends');
});

test('worked example goes demo -> הבנתי -> עכשיו לבד on a read-only children DOM', () => {
  const h = host();
  PW.renderWorkedExampleWidget(h, PW.createWorkedExampleExercise({ a: 3, b: 2, stage: 'demo' }), quiet);
  assert.equal(h._stage, 'demo');
  assert.ok(h.children.length > 0);
  find(h, 'demo-proceed-btn').onclick();
  assert.equal(h._stage, 'completion');
  assert.equal(h.children.length, 1);
  find(h, 'completion-tap-btn').onclick();
  assert.equal(h._stage, 'independent');
  assert.equal(h.children.length, 1);
  assert.match(h.textContent, /עכשיו לבד/);
});

test('mm-cur-6: the silent last round of patterns is headed עכשיו לבד', () => {
  const V = require('../src/lib/exercises/variety.js');
  const last = V.generateVariant({ topicId: 'mm-cur-6', kind: 'pattern_completion', prompt: 'old' }, 2, { rounds: 3 });
  assert.equal(last.noMusic, true, 'the last round is the silent one');
  const h = host();
  const ex = Object.assign(PW.createPatternCompletionExercise({ pattern: ['דו', 'מי', 'דו', 'מי'] }), { noMusic: last.noMusic });
  let played = 0;
  PW.renderPatternWidget(h, ex, { playTap() { played++; }, later() { return 0; } });
  assert.match(h.textContent, /^עכשיו לבד/);
  assert.equal(find(h, 'demo-listen-btn'), null, 'still no demo button in the silent round');
  find(h, 'pattern-choice-btn').onclick();
  assert.equal(played, 0, 'the silent round stays silent');
  const musical = host();
  PW.renderPatternWidget(musical, PW.createPatternCompletionExercise({}), quiet);
  assert.doesNotMatch(musical.textContent, /עכשיו לבד/, 'only the silent round gets the heading');
});

test('a noMusic worked example renders straight at עכשיו לבד', () => {
  const h = host();
  const ex = Object.assign(PW.createWorkedExampleExercise({ a: 4, b: 1, stage: 'demo' }), { noMusic: true });
  PW.renderWorkedExampleWidget(h, ex, quiet);
  assert.equal(h._stage, 'independent');
  assert.ok(h.children.length > 0);
  assert.match(h.textContent, /עכשיו לבד/);
});
