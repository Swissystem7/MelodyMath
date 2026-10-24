const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// #459: pressing "בדיקה" with an empty answer used to be a silent no-op.
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const grab = name => {
  const m = indexHtml.match(new RegExp(`^function ${name}\\(.*$`, 'm'));
  assert.ok(m, `${name} found in index.html`);
  return m[0];
};

function run(fnName, inputId, feedbackId, flagName) {
  const els = {};
  const el = id => els[id] || (els[id] = { id, value: '   ', className: 'feedback hidden', textContent: '', focused: false, focus() { this.focused = true; } });
  const logged = [];
  const ctx = {
    $: el,
    show: (id, on) => { el(id).className = on ? el(id).className.replace(/\s*hidden/, '') : `${el(id).className} hidden`; },
    normalizeAnswer: v => String(v).trim(),
    noteMetro: () => logged.push('metro'),
    logTeacherItem: x => logged.push(x),
    rmAns: [],
    history: [],
    [flagName]: false,
  };
  vm.createContext(ctx);
  vm.runInContext(`${grab('askForAnswer')}\n${grab(fnName)}\n${fnName}();`, ctx);
  return { ctx, input: el(inputId), fb: el(feedbackId), logged };
}

for (const [fnName, inputId, feedbackId, flagName] of [
  ['rmCheck', 'rmAnswer', 'rmFeedback', 'rmAnswered'],
  ['rpCheck', 'rmPlanAnswer', 'rmPlanFeedback', 'rpAnswered'],
  ['check', 'answer', 'feedback', 'answered'],
]) {
  test(`${fnName} with an empty answer shows a hint, keeps focus on the input and records nothing`, () => {
    const { ctx, input, fb, logged } = run(fnName, inputId, feedbackId, flagName);
    assert.equal(fb.textContent, 'כתבו תשובה קודם 🙂');
    assert.equal(fb.className, 'feedback');
    assert.equal(input.focused, true);
    assert.equal(ctx[flagName], false);
    assert.deepEqual(logged, []);
    assert.deepEqual(ctx.rmAns, []);
    assert.deepEqual(ctx.history, []);
  });
}

test('the hint goes through the existing aria-live feedback elements', () => {
  for (const id of ['rmFeedback', 'rmPlanFeedback', 'feedback']) {
    assert.match(indexHtml, new RegExp(`id="${id}"[^>]*role="status"[^>]*aria-live="polite"`));
  }
});
